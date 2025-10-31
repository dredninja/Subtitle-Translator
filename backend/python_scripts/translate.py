import sys
import json
import time
import pysrt
from transformers import MarianMTModel, MarianTokenizer

# -------------------
# Args
# -------------------
uploaded_srt = sys.argv[1]  # input SRT
src_lang = sys.argv[2]      # source language (e.g., "en")
tgt_lang = sys.argv[3]      # target language (e.g., "es")
out_base = sys.argv[4]      # output file prefix

out_srt_path = f"{out_base}.srt"
out_json_path = f"{out_base}.json"

# -------------------
# Load SRT
# -------------------
subs = pysrt.open(uploaded_srt)

# -------------------
# Load MarianMT model
# -------------------
model_name = f"Helsinki-NLP/opus-mt-{src_lang}-{tgt_lang}"
tokenizer = MarianTokenizer.from_pretrained(model_name)
model = MarianMTModel.from_pretrained(model_name)
model.eval()

# -------------------
# Translate line by line
# -------------------
report = []

for i, sub in enumerate(subs):
    original_text = sub.text  # store original line

    # Tokenize and generate translation
    inputs = tokenizer(original_text, return_tensors="pt", padding=True, truncation=True)
    outputs = model.generate(**inputs, max_length=128, num_beams=2)
    translated_text = tokenizer.decode(outputs[0], skip_special_tokens=True)

    # Update subtitle
    sub.text = translated_text

    # Add to report
    report.append({
        "index": sub.index,
        "original": original_text,
        "translated": translated_text
    })

    # Stream progress for frontend
    progress = (i + 1) / len(subs)
    print(json.dumps({"progress": progress}))
    sys.stdout.flush()
    time.sleep(0.01)  # optional delay for smooth streaming

# -------------------
# Save output SRT
# -------------------
subs.save(out_srt_path, encoding="utf-8")

# -------------------
# Save output JSON
# -------------------
with open(out_json_path, "w", encoding="utf-8") as f:
    json.dump(report, f, indent=2, ensure_ascii=False)

# -------------------
# Final message
# -------------------
print(json.dumps({
    "progress": 1,
    "srt_file": out_srt_path,
    "json_file": out_json_path
}))
sys.stdout.flush()


