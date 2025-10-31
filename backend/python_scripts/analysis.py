# analysis.py
import json, os, sys

def find_latest_similarity_json(downloads_dir):
    files = [f for f in os.listdir(downloads_dir) if f.endswith(".json") and "similarity" in f]
    if not files:
        return None
    files.sort(key=lambda x: os.path.getmtime(os.path.join(downloads_dir, x)), reverse=True)
    return os.path.join(downloads_dir, files[0])

if __name__ == "__main__":
    downloads_dir = sys.argv[1] if len(sys.argv) > 1 else "."
    sim_json_path = find_latest_similarity_json(downloads_dir)
    if not sim_json_path:
        print(json.dumps({"error": "No similarity JSON found for analysis"}))
    else:
        with open(sim_json_path, "r", encoding="utf-8") as f:
            report = json.load(f)
        similarities = [r.get("similarity", 0.0) for r in report]
        stats = {
            "count": len(similarities),
            "min": min(similarities) if similarities else 0.0,
            "max": max(similarities) if similarities else 0.0,
            "avg": sum(similarities) / len(similarities) if similarities else 0.0,
            "similarities": similarities
        }
        print(json.dumps(stats))
