import os
import pysrt
import json
from datetime import datetime
from tqdm import tqdm
import torch
from transformers import MarianMTModel, MarianTokenizer
from difflib import SequenceMatcher

class HybridSubtitleTranslatorCPUOptimized:
    def __init__(self, src_lang="en", tgt_lang="es", batch_size=32, max_cps=15):
        self.device = "cpu"
        self.src_lang = src_lang
        self.tgt_lang = tgt_lang
        self.batch_size = batch_size
        self.max_cps = max_cps

        # Load forward translation model
        self.model_name = f"Helsinki-NLP/opus-mt-{src_lang}-{tgt_lang}"
        print(f"Loading MarianMT model {self.model_name} on CPU")
        self.tokenizer = MarianTokenizer.from_pretrained(self.model_name)
        self.model = MarianMTModel.from_pretrained(self.model_name)
        self.model.eval()

        # Load back-translation model for evaluation
        self.bt_model_name = f"Helsinki-NLP/opus-mt-{tgt_lang}-{src_lang}"
        self.bt_tokenizer = MarianTokenizer.from_pretrained(self.bt_model_name)
        self.bt_model = MarianMTModel.from_pretrained(self.bt_model_name)
        self.bt_model.eval()

        torch.set_num_threads(os.cpu_count())
        print(f"Using {torch.get_num_threads()} CPU threads")

    def clean_text(self, text):
        return text.replace("\n", " ").strip()

    def is_sound_cue(self, text):
        stripped = text.strip()
        return stripped.startswith("[") and stripped.endswith("]")

    def _similarity(self, a, b):
        """Compute text similarity for back-translation comparison."""
        return SequenceMatcher(None, a.lower(), b.lower()).ratio()

    def _paraphrase_trim(self, text):
        """Heuristic to shorten overly long translations."""
        words = text.split()
        if len(words) > 15:
            return " ".join(words[:15]) + "..."
        return text

    def batch_translate(self, texts, model=None, tokenizer=None, max_length=128):
        """Translate in batches and compute average confidence."""
        if not texts:
            return []
        model = model or self.model
        tokenizer = tokenizer or self.tokenizer
        translations = []
        for i in tqdm(range(0, len(texts), self.batch_size), desc="Translating"):
            batch = texts[i:i+self.batch_size]
            if not batch:
                continue
            inputs = tokenizer(
                batch, return_tensors="pt", padding=True,
                truncation=True, max_length=max_length
            )
            with torch.inference_mode():
                outputs = model.generate(
                    **inputs,
                    max_length=max_length,
                    num_beams=1,
                    return_dict_in_generate=True,
                    output_scores=True
                )
            decoded = tokenizer.batch_decode(outputs.sequences, skip_special_tokens=True)
            # approximate average log-prob confidence
            if outputs.scores:
                avg_score = float(sum(s.mean().item() for s in outputs.scores) / len(outputs.scores))
            else:
                avg_score = 0.0
            for text in decoded:
                translations.append((text, avg_score))
        return translations

    def _group_context(self, subs):
        """Group short subtitles together for context-aware translation."""
        grouped = []
        temp = []
        for sub in subs:
            clean = self.clean_text(sub.text)
            if len(clean) < 10:
                temp.append(sub)
            else:
                if temp:
                    grouped.append(temp)
                    temp = []
                grouped.append([sub])
        if temp:
            grouped.append(temp)
        return grouped

    def translate_subtitles(self, subs):
        translated_subs = []
        grouped_subs = self._group_context(subs)

        for group in grouped_subs:
            texts = [self.clean_text(s.text) for s in group]
            merged_text = " ".join(texts)
            is_cue = all(self.is_sound_cue(t) for t in texts)

            # Forward translation
            (fwd_trans, fwd_conf) = self.batch_translate([merged_text])[0]

            # Back-translation for evaluation
            (bt_text, _) = self.batch_translate(
                [fwd_trans],
                model=self.bt_model,
                tokenizer=self.bt_tokenizer
            )[0]
            sim_score = self._similarity(merged_text, bt_text)

            # Reading speed calculation
            start_sec = self._time_to_seconds(str(group[0].start))
            end_sec = self._time_to_seconds(str(group[-1].end))
            duration = max(1e-3, end_sec - start_sec)
            cps = len(fwd_trans) / duration

            if cps > self.max_cps:
                fwd_trans = self._paraphrase_trim(fwd_trans)

            if is_cue:
                fwd_trans = f"[{fwd_trans.strip('[]')}]"

            for s in group:
                translated_subs.append({
                    "index": s.index,
                    "original": s.text.strip(),
                    "translated": fwd_trans,
                    "start": str(s.start),
                    "end": str(s.end),
                    "reading_speed_cps": round(cps, 2),
                    "reading_speed_ok": cps <= self.max_cps,
                    "confidence": round(fwd_conf, 3),
                    "back_translation_match": round(sim_score, 3),
                    "duration_sec": round(duration, 2)
                })

        return translated_subs

    def generate_summary(self, subs):
        """Aggregate translation quality summary for web display."""
        if not subs:
            return {}
        avg_conf = sum(s["confidence"] for s in subs) / len(subs)
        avg_bt = sum(s["back_translation_match"] for s in subs) / len(subs)
        high_speed = sum(1 for s in subs if not s["reading_speed_ok"])
        return {
            "average_confidence": round(avg_conf, 3),
            "average_similarity": round(avg_bt, 3),
            "high_speed_count": high_speed,
            "total_subtitles": len(subs),
            "language_pair": f"{self.src_lang}→{self.tgt_lang}"
        }

    def export_to_json(self, subs, filepath):
        """Export detailed translations + quality summary to JSON."""
        summary = self.generate_summary(subs)
        data = {
            "summary": summary,
            "subtitles": subs
        }
        with open(filepath, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=4, ensure_ascii=False)
        print(f"JSON exported to: {filepath}")

    def export_to_srt(self, subs, filepath):
        """Export translated SRT file."""
        srt_subs = pysrt.SubRipFile()
        for sub in subs:
            srt_subs.append(
                pysrt.SubRipItem(
                    index=sub["index"],
                    start=sub["start"],
                    end=sub["end"],
                    text=sub["translated"]
                )
            )
        srt_subs.save(filepath, encoding="utf-8")
        print(f"SRT exported to: {filepath}")

    def make_dynamic_filename(self, prefix="Translated"):
        now = datetime.now().strftime("%Y%m%d_%H%M%S")
        return f"{prefix}_{now}"
