# manual_correction.py
import sys, json
import pysrt
import os

if __name__ == "__main__":
    translations_path = sys.argv[1]
    corrections_path = sys.argv[2]
    out_srt_path = sys.argv[3] if len(sys.argv) > 3 else translations_path.replace(".srt", "_corrected.srt")

    subs = pysrt.open(translations_path)
    with open(corrections_path, "r", encoding="utf-8") as f:
        corrections = json.load(f)

    for c in corrections:
        idx = c.get("index", None)
        new_text = c.get("corrected_translation", None)
        if idx is None or new_text is None:
            continue
        i = idx - 1
        if 0 <= i < len(subs):
            subs[i].text = new_text

    subs.save(out_srt_path, encoding="utf-8")
    print(json.dumps({"corrected_srt": os.path.basename(out_srt_path)}))
