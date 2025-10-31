# my_similarity_checker.py
import pysrt
import json
import torch
from transformers import MarianMTModel, MarianTokenizer
from sentence_transformers import SentenceTransformer, util
from tqdm import tqdm
import time
import re

class SRTSimilarityCheckerCPUOptimized:
    def __init__(self, src_lang="es", tgt_lang="en", batch_size=128, back_translate=True):
        """
        src_lang: language of the original SRT (e.g., 'es' for Spanish)
        tgt_lang: target language (usually 'en')
        """
        self.device = "cpu"
        torch.set_num_threads(max(4, torch.get_num_threads()))
        print(f"Using {torch.get_num_threads()} CPU threads")

        self.src_lang = src_lang
        self.tgt_lang = tgt_lang
        self.batch_size = batch_size
        self.back_translate = back_translate

        # Load MarianMT for back-translation
        self.model_name = f"Helsinki-NLP/opus-mt-{self.tgt_lang}-{self.src_lang}"
        print(f"Loading MarianMT model {self.model_name} on CPU")
        self.tokenizer = MarianTokenizer.from_pretrained(self.model_name)
        self.model = MarianMTModel.from_pretrained(self.model_name)
        self.model.eval()

        # Load better cross-lingual similarity model
        print("Loading SentenceTransformer (distiluse-base-multilingual-cased-v2) on CPU")
        self.sim_model = SentenceTransformer("distiluse-base-multilingual-cased-v2", device="cpu")

    @staticmethod
    def normalize_text(text):
        text = text.lower()
        text = re.sub(r"[^\w\s]", "", text)
        text = re.sub(r"\s+", " ", text).strip()
        return text

    @staticmethod
    def preprocess_srt_lines(subs, min_len=2):
        """
        Filter out very short lines or stage directions like [Music], [Applause]
        """
        cleaned = []
        for sub in subs:
            text = sub.text.strip()
            if not text or text.startswith("[") or len(text.split()) < min_len:
                continue
            cleaned.append(text)
        return cleaned

    def batch_translate(self, texts, max_length=128):
        translations = []
        translation_cache = {}

        for i in tqdm(range(0, len(texts), self.batch_size), desc="Back-translating"):
            batch = [t for t in texts[i:i+self.batch_size] if t]
            if not batch:
                continue

            uncached = [t for t in batch if t not in translation_cache]
            if uncached:
                inputs = self.tokenizer(
                    uncached, return_tensors="pt", padding=True,
                    truncation=True, max_length=max_length
                )
                with torch.inference_mode():
                    outputs = self.model.generate(**inputs, max_length=max_length, num_beams=2)
                decoded = self.tokenizer.batch_decode(outputs, skip_special_tokens=True)
                for o, d in zip(uncached, decoded):
                    translation_cache[o] = d

            translations += [translation_cache.get(t, "") for t in batch]
            time.sleep(0.05)
        return translations

    def encode_in_batches(self, texts):
        embeddings = []
        for i in tqdm(range(0, len(texts), self.batch_size), desc="Encoding embeddings"):
            batch = [self.normalize_text(t) for t in texts[i:i+self.batch_size] if t]
            if not batch:
                continue
            emb = self.sim_model.encode(
                batch, convert_to_tensor=True, show_progress_bar=False, batch_size=32
            )
            embeddings.append(emb)
        if embeddings:
            return torch.cat(embeddings)
        else:
            return torch.empty((0, self.sim_model.get_sentence_embedding_dimension()))

    def compute_srt_similarity(self, original_srt_path, translated_srt_path, threshold=0.7):
        original_subs = pysrt.open(original_srt_path)
        translated_subs = pysrt.open(translated_srt_path)

        orig_texts = self.preprocess_srt_lines(original_subs)
        trans_texts = self.preprocess_srt_lines(translated_subs)

        n = min(len(orig_texts), len(trans_texts))
        orig_texts = orig_texts[:n]
        trans_texts = trans_texts[:n]

        # Back-translate if enabled
        back_texts = self.batch_translate(trans_texts) if self.back_translate else trans_texts

        # Encode embeddings
        orig_emb = self.encode_in_batches(orig_texts)
        back_emb = self.encode_in_batches(back_texts)

        if orig_emb.shape[0] == 0 or back_emb.shape[0] == 0:
            similarities = torch.zeros(n)
        else:
            similarities = util.cos_sim(orig_emb, back_emb).diagonal()

        # Build report
        report = []
        low_accuracy_lines = []
        for i in range(n):
            sim_score = similarities[i].item() if i < len(similarities) else 0.0
            entry = {
                "index": i + 1,
                "original": orig_texts[i],
                "translated": trans_texts[i],
                "back_translated": back_texts[i] if i < len(back_texts) else "",
                "similarity": sim_score
            }
            report.append(entry)
            if sim_score < threshold:
                low_accuracy_lines.append(entry)

        overall_similarity = similarities.mean().item() if n > 0 else 0
        summary = {
            "total_lines": n,
            "below_threshold": len(low_accuracy_lines),
            "threshold": threshold,
            "overall_similarity": overall_similarity
        }

        return {"summary": summary, "report": report}

# Example usage for testing
if __name__ == "__main__":
    import sys
    import json
    if len(sys.argv) < 3:
        print("Usage: python my_similarity_checker.py <original_srt> <translated_srt>")
        sys.exit(1)

    original_srt = sys.argv[1]
    translated_srt = sys.argv[2]

    checker = SRTSimilarityCheckerCPUOptimized(src_lang="es", tgt_lang="en")
    result = checker.compute_srt_similarity(original_srt, translated_srt, threshold=0.7)

    output_file = f"{translated_srt}_similarity.json"
    with open(output_file, "w", encoding="utf-8") as f:
        json.dump(result, f, indent=2, ensure_ascii=False)
    print(f"✅ Saved similarity report to {output_file}")


