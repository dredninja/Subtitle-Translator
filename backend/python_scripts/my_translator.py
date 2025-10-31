import os
import pysrt
import json
from datetime import datetime
from tqdm import tqdm
import torch
from transformers import MarianMTModel, MarianTokenizer

class HybridSubtitleTranslatorCPUOptimized:
    def __init__(self, src_lang="en", tgt_lang="es", batch_size=32, max_cps=15):
        self.device = "cpu"
        self.src_lang = src_lang
        self.tgt_lang = tgt_lang
        self.batch_size = batch_size
        self.max_cps = max_cps

        self.model_name = f"Helsinki-NLP/opus-mt-{src_lang}-{tgt_lang}"
        print(f"Loading MarianMT model {self.model_name} on CPU")
        self.tokenizer = MarianTokenizer.from_pretrained(self.model_name)
        self.model = MarianMTModel.from_pretrained(self.model_name)
        self.model.eval()

        torch.set_num_threads(os.cpu_count())
        print(f"Using {torch.get_num_threads()} CPU threads")

    def clean_text(self, text):
        return text.replace("\n", " ").strip()

    def is_sound_cue(self, text):
        stripped = text.strip()
        return stripped.startswith("[") and stripped.endswith("]")

    def batch_translate(self, texts, max_length=128):
        if not texts:
            return []
        translations = []
        for i in tqdm(range(0, len(texts), self.batch_size), desc="Translating"):
            batch = texts[i:i+self.batch_size]
            if not batch:
                continue
            inputs = self.tokenizer(
                batch, return_tensors="pt", padding=True,
                truncation=True, max_length=max_length
            )
            with torch.inference_mode():
                outputs = self.model.generate(**inputs, max_length=max_length, num_beams=1)
            translations += self.tokenizer.batch_decode(outputs, skip_special_tokens=True)
        return translations

    def translate_subtitles(self, subs):
        translated_subs = []
        texts = [self.clean_text(sub.text) for sub in subs]
        n = len(texts)
        cue_flags = [self.is_sound_cue(t) for t in texts]

        for i in range(0, n, self.batch_size):
            batch_texts = texts[i:i+self.batch_size]
            batch_flags = cue_flags[i:i+self.batch_size]
            marian_trans = self.batch_translate(batch_texts)

            for j, t in enumerate(marian_trans):
                if batch_flags[j]:
                    t = f"[{t.strip('[]')}]"

                start_sec = self._time_to_seconds(str(subs[i+j].start))
                end_sec = self._time_to_seconds(str(subs[i+j].end))
                duration = max(1e-3, end_sec - start_sec)
                cps = len(t) / duration

                translated_subs.append({
                    "index": subs[i+j].index,
                    "start": str(subs[i+j].start),
                    "end": str(subs[i+j].end),
                    "original": subs[i+j].text.strip(),
                    "translated": t,
                    "reading_speed_ok": cps <= self.max_cps
                })

        return translated_subs

    def _time_to_seconds(self, time_str):
        h, m, s = time_str.split(":")
        s, ms = s.split(",")
        return int(h)*3600 + int(m)*60 + int(s) + int(ms)/1000

    def export_to_json(self, subs, filepath):
        with open(filepath, "w", encoding="utf-8") as f:
            json.dump(subs, f, indent=4, ensure_ascii=False)
        print(f"JSON exported to: {filepath}")

    def export_to_srt(self, subs, filepath):
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