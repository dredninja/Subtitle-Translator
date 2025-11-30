import json
import matplotlib.pyplot as plt
import seaborn as sns
import pandas as pd
from pathlib import Path

# -----------------------
# Fixed input path
# -----------------------
json_file = r"C:\Users\adity\subtitle-webapp\backend\python_scripts\translated_1762535368818_a4294561-8699-46ae-ac6c-3e69dcfa1ee7_20251107_223937.json"

# -----------------------
# Load data
# -----------------------
with open(json_file, "r", encoding="utf-8") as f:
    data = json.load(f)

subs = pd.DataFrame(data["subtitles"])
meta = data["metadata"]

print("\n=== Metadata Summary ===")
for k, v in meta.items():
    print(f"{k}: {v}")

# -----------------------
# Visualization setup
# -----------------------
sns.set(style="whitegrid", font_scale=1.2)
fig_dir = Path("figures")
fig_dir.mkdir(exist_ok=True)

# -----------------------
# 1. Histogram of Reading Speed (CPS)
# -----------------------
plt.figure(figsize=(8,5))
sns.histplot(subs["reading_speed_cps"], bins=20, kde=True, color="skyblue")
plt.axvline(20, color="red", linestyle="--", label="High-Speed Threshold (20 CPS)")
plt.title("Distribution of Reading Speed (Characters per Second)")
plt.xlabel("CPS (Characters per Second)")
plt.ylabel("Subtitle Count")
plt.legend()
plt.tight_layout()
plt.savefig(fig_dir / "reading_speed_distribution.png", dpi=300)
plt.close()

# -----------------------
# 2. Back-Translation Similarity Distribution
# -----------------------
plt.figure(figsize=(8,5))
sns.histplot(subs["back_translation_match"], bins=20, kde=True, color="seagreen")
plt.axvline(0.95, color="orange", linestyle="--", label="Novelty Threshold (0.95)")
plt.title("Semantic Fidelity via Back-Translation Similarity")
plt.xlabel("Cosine Similarity")
plt.ylabel("Subtitle Count")
plt.legend()
plt.tight_layout()
plt.savefig(fig_dir / "back_translation_similarity.png", dpi=300)
plt.close()

# -----------------------
# 3. Scatter plot: Reading Speed vs Similarity
# -----------------------
plt.figure(figsize=(7,6))
sns.scatterplot(
    x="reading_speed_cps",
    y="back_translation_match",
    data=subs,
    hue="novelty",
    palette={True: "red", False: "blue"},
    alpha=0.7
)
plt.title("Reading Speed vs Semantic Similarity")
plt.xlabel("Reading Speed (CPS)")
plt.ylabel("Back-Translation Similarity")
plt.legend(title="Novelty Detected")
plt.tight_layout()
plt.savefig(fig_dir / "cps_vs_similarity.png", dpi=300)
plt.close()

# -----------------------
# 4. Summary Metrics Bar Plot
# -----------------------
summary_df = pd.DataFrame({
    "Metric": ["Average CPS", "Avg. Similarity", "High-Speed Lines"],
    "Value": [meta["avg_cps"], meta["avg_bt_match"], meta["high_speed_count"]]
})

plt.figure(figsize=(6,5))
sns.barplot(x="Metric", y="Value", data=summary_df, palette="viridis")
plt.title("Summary of Translation Quality Metrics")
plt.ylabel("Value")
plt.tight_layout()
plt.savefig(fig_dir / "summary_metrics.png", dpi=300)
plt.close()

# -----------------------
# Optional: print sample translations
# -----------------------
sample_df = subs.sample(5, random_state=42)
print("\n=== Sample Translations ===")
for _, row in sample_df.iterrows():
    print(f"\n[{row['index']}]")
    print(f"Original:   {row['original']}")
    print(f"Translated: {row['translated']}")
    print(f"Similarity: {row['back_translation_match']:.3f}")

# -----------------------
# Done
# -----------------------
print("\n✅ Visualizations saved in 'figures/' folder:")
for f in fig_dir.iterdir():
    print(" -", f.name)
