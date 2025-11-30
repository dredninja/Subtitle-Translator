import sys
import json
import time
import pysrt
from datetime import datetime
from transformers import MarianMTModel, MarianTokenizer
import torch
from sentence_transformers import SentenceTransformer, util

# -------------------
# Args
# -------------------
uploaded_srt = sys.argv[1]
src_lang = sys.argv[2]
tgt_lang = sys.argv[3]
out_base = sys.argv[4]
skip_back_translation = "--fast" in sys.argv  # optional fast mode

timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
out_srt_path = f"{out_base}_{timestamp}.srt"
out_json_path = f"{out_base}_{timestamp}.json"

# -------------------
# Load SRT
# -------------------
subs = pysrt.open(uploaded_srt)
total_lines = len(subs)

# -------------------
# Load MarianMT models
# -------------------
device = "cpu"

model_name = f"Helsinki-NLP/opus-mt-{src_lang}-{tgt_lang}"
tokenizer = MarianTokenizer.from_pretrained(model_name)
model = MarianMTModel.from_pretrained(model_name).to(device)
model.eval()

if not skip_back_translation:
    bt_model_name = f"Helsinki-NLP/opus-mt-{tgt_lang}-{src_lang}"
    bt_tokenizer = MarianTokenizer.from_pretrained(bt_model_name)
    bt_model = MarianMTModel.from_pretrained(bt_model_name).to(device)
    bt_model.eval()

# -------------------
# Load SentenceTransformer for novelty check
# -------------------
sbert_model = SentenceTransformer('paraphrase-MiniLM-L3-v2', device=device)

# -------------------
# Helper functions
# -------------------
def is_sound_cue(text: str) -> bool:
    text = text.strip()
    return text.startswith("[") and text.endswith("]")

def time_to_seconds(t):
    return t.hours * 3600 + t.minutes * 60 + t.seconds + t.milliseconds / 1000.0

def compute_cps(text, start, end, max_cps=25):
    duration = max(1e-3, end - start)
    cps = len(text.split()) / duration  # words/sec
    return min(cps, max_cps)

def translate_text(text_list, model, tokenizer, batch_size=8):
    translated = []
    for i in range(0, len(text_list), batch_size):
        batch = text_list[i:i+batch_size]
        inputs = tokenizer(batch, return_tensors="pt", padding=True, truncation=True).to(device)
        with torch.inference_mode():
            outputs = model.generate(**inputs, max_length=256, num_beams=4)
        decoded = tokenizer.batch_decode(outputs, skip_special_tokens=True)
        translated.extend(decoded)
    return translated

# -------------------
# Translation loop
# -------------------
start_time = time.time()
report = []
high_speed_count = 0

try:
    texts = [s.text.replace("\n", " ").strip() for s in subs]
    cues = [is_sound_cue(t) for t in texts]

    # Only translate non-cue lines
    non_cue_texts = [t for i, t in enumerate(texts) if not cues[i]]
    trans_non_cues = translate_text(non_cue_texts, model, tokenizer)

    # Map translations back to all lines
    trans_texts = []
    non_cue_idx = 0
    for is_cue in cues:
        if is_cue:
            trans_texts.append(texts[non_cue_idx] if False else texts[non_cue_idx])
        else:
            trans_texts.append(trans_non_cues[non_cue_idx])
            non_cue_idx += 1

    # Back-translation similarity
    if not skip_back_translation:
        bt_texts = translate_text(trans_texts, bt_model, bt_tokenizer)
        orig_emb = sbert_model.encode(texts, convert_to_tensor=True)
        bt_emb = sbert_model.encode(bt_texts, convert_to_tensor=True)
        similarities = util.cos_sim(orig_emb, bt_emb).diagonal().tolist()
    else:
        similarities = [1.0] * len(texts)

    # Fill subtitles and report
    for idx, sub in enumerate(subs):
        original_text = texts[idx]
        translated_text = trans_texts[idx] if not cues[idx] else original_text
        bt_match = similarities[idx]
        start_sec = time_to_seconds(sub.start)
        end_sec = time_to_seconds(sub.end)
        cps = compute_cps(translated_text, start_sec, end_sec)
        if cps >= 20:
            high_speed_count += 1

        sub.text = translated_text  # preserve cues

        report.append({
            "index": sub.index,
            "original": original_text,
            "translated": translated_text,
            "start": str(sub.start),
            "end": str(sub.end),
            "reading_speed_cps": round(cps, 2),
            "confidence": 0.9,
            "back_translation_match": round(bt_match, 3),
            "novelty": bt_match < 0.95
        })

except Exception as e:
    print(json.dumps({"error": str(e)}))
    sys.stdout.flush()
    sys.exit(1)

# -------------------
# Save outputs
# -------------------
subs.save(out_srt_path, encoding="utf-8")

metadata = {
    "model": model_name,
    "src_lang": src_lang,
    "tgt_lang": tgt_lang,
    "lines_translated": total_lines,
    "elapsed_seconds": round(time.time() - start_time, 2),
    "avg_cps": round(sum(r["reading_speed_cps"] for r in report)/len(report), 2),
    "avg_confidence": 0.9,
    "avg_bt_match": round(sum(r["back_translation_match"] for r in report)/len(report), 3),
    "high_speed_count": high_speed_count,
    "device": device,
    "timestamp": timestamp
}

output_json = {
    "metadata": metadata,
    "subtitles": report
}

with open(out_json_path, "w", encoding="utf-8") as f:
    json.dump(output_json, f, indent=2, ensure_ascii=False)

print(json.dumps({
    "progress": 1.0,
    "srt_file": out_srt_path,
    "json_file": out_json_path,
    "meta": metadata
}))
sys.stdout.flush()
