# python_scripts/similarity.py
import argparse
import json
from pathlib import Path
import pysrt
from transformers import MarianMTModel, MarianTokenizer
from sentence_transformers import SentenceTransformer, util

def translate_lines(lines, src_lang, tgt_lang, max_length=128):
    """
    Translate a list of lines from src_lang -> tgt_lang using MarianMT.
    """
    model_name = f"Helsinki-NLP/opus-mt-{src_lang}-{tgt_lang}"
    tokenizer = MarianTokenizer.from_pretrained(model_name)
    model = MarianMTModel.from_pretrained(model_name)
    model.eval()

    translated_lines = []
    for line in lines:
        inputs = tokenizer(line, return_tensors="pt", padding=True, truncation=True)
        outputs = model.generate(**inputs, max_length=max_length, num_beams=2)
        translated_text = tokenizer.decode(outputs[0], skip_special_tokens=True)
        translated_lines.append(translated_text)
    return translated_lines

def main():
    parser = argparse.ArgumentParser(description="Compute similarity between original and translated SRT files.")
    parser.add_argument("original_srt", type=str, help="Path to original SRT file")
    parser.add_argument("translated_srt", type=str, help="Path to translated SRT file")
    parser.add_argument("--src_lang", type=str, default="en", help="Source language code")
    parser.add_argument("--tgt_lang", type=str, default="es", help="Target language code")
    parser.add_argument("--threshold", type=float, default=0.7, help="Similarity threshold (0-1)")
    parser.add_argument("--out_json", type=str, required=True, help="Output JSON file path")

    args = parser.parse_args()

    # Load SRTs
    orig_subs = pysrt.open(args.original_srt)
    trans_subs = pysrt.open(args.translated_srt)

    # Extract lines
    orig_lines = [sub.text for sub in orig_subs]
    trans_lines = [sub.text for sub in trans_subs]

    # Back-translate: tgt_lang -> src_lang
    back_trans_lines = translate_lines(trans_lines, args.tgt_lang, args.src_lang)

    # Initialize multilingual SBERT
    sbert_model = SentenceTransformer("paraphrase-multilingual-MiniLM-L12-v2")

    report = []
    for idx, (orig, trans, back_trans) in enumerate(zip(orig_lines, trans_lines, back_trans_lines), 1):
        emb_orig = sbert_model.encode(orig, convert_to_tensor=True)
        emb_back = sbert_model.encode(back_trans, convert_to_tensor=True)
        similarity = util.cos_sim(emb_orig, emb_back).item()

        report.append({
            "index": idx,
            "original": orig,
            "translated": trans,
            "back_translated": back_trans,
            "similarity": round(similarity, 3),
            "reading_speed_ok": True  # optional, keep for frontend consistency
        })

    # Compute summary
    similarities = [r["similarity"] for r in report]
    summary = {
        "num_lines": len(report),
        "average_similarity": round(sum(similarities) / len(similarities), 3),
        "threshold": args.threshold
    }

    result = {"summary": summary, "report": report}

    # Save JSON
    out_path = Path(args.out_json)
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(result, f, indent=2, ensure_ascii=False)

    # Print JSON for Node.js consumption
    print(json.dumps(result, ensure_ascii=False))

if __name__ == "__main__":
    main()









