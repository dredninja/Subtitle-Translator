// src/pages/SimilarityPage.js
import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

export default function SimilarityPage() {
  const { token } = useAuth();
  const navigate = useNavigate();

  const [original, setOriginal] = useState(null);
  const [translated, setTranslated] = useState(null);
  const [threshold, setThreshold] = useState(0.7);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [lowSimLines, setLowSimLines] = useState([]);

  async function checkSimilarity(originalFile, translatedFile, threshold) {
    const formData = new FormData();
    formData.append("original", originalFile);
    formData.append("translated", translatedFile);
    formData.append("threshold", threshold);

    const res = await fetch("http://localhost:8007/api/similarity", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });

    if (!res.ok) throw new Error("Server error during similarity check");
    const data = await res.json();
    const lowSim = data.report?.filter(r => r.similarity < threshold) || [];
    return { data, lowSim };
  }

  const handleSubmit = async () => {
    if (!original || !translated) return setError("Upload both files!");
    setLoading(true);
    setError("");
    setLowSimLines([]);

    try {
      const { data, lowSim } = await checkSimilarity(original, translated, threshold);
      setLowSimLines(lowSim);

      // Navigate to manual review page with the full data
      navigate("/manual-review", { 
        state: { report: data.report, threshold: data.summary.threshold, summary: data.summary } 
      });
    } catch (err) {
      console.error(err);
      setError(err.message || "Network error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.pageContainer}>
      <h2>Similarity Checker</h2>
      <input type="file" accept=".srt" onChange={e => setOriginal(e.target.files[0])} />
      <input type="file" accept=".srt" onChange={e => setTranslated(e.target.files[0])} />
      <input type="number" min="0" max="1" step="0.01" value={threshold} onChange={e => setThreshold(parseFloat(e.target.value))} />
      <button onClick={handleSubmit} disabled={loading}>{loading ? "Processing..." : "Check Similarity"}</button>

      {error && <p style={{ color: "red" }}>{error}</p>}
      {lowSimLines.length > 0 && (
        <div>
          <h4>Low similarity lines ({lowSimLines.length}):</h4>
          <ul>
            {lowSimLines.map(line => (
              <li key={line.index}><strong>Line {line.index}:</strong> {line.original} → {line.translated} ({line.similarity.toFixed(2)})</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}


const styles = {
  pageContainer: { fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif", minHeight: "100vh", display: "flex", flexDirection: "column", backgroundColor: "#f5f6fa" },
  hero: { flex: 1, display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", padding: "3rem 2rem", background: "linear-gradient(to right, #dfe9f3, #ffffff)", borderRadius: "0 0 30% 30% / 10%", boxShadow: "0 6px 15px rgba(0,0,0,0.05)" },
  heroTitle: { fontSize: "2rem", marginBottom: "0.8rem", fontWeight: "bold", color: "#333" },
  heroText: { fontSize: "1rem", maxWidth: "650px", marginBottom: "2rem", color: "#555" },
  form: { backgroundColor: "#ffffff", padding: "2rem", borderRadius: "15px", width: "100%", maxWidth: "500px", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" },
  inputGroup: { marginBottom: "1rem", display: "flex", flexDirection: "column", textAlign: "left" },
  label: { marginBottom: "0.3rem", fontWeight: "500", color: "#333" },
  input: { padding: "0.5rem", borderRadius: "8px", border: "1px solid #ccc", fontSize: "0.95rem" },
  button: { width: "100%", padding: "0.8rem", backgroundColor: "#6c63ff", color: "#fff", border: "none", borderRadius: "30px", fontWeight: "bold", cursor: "pointer", fontSize: "1rem", transition: "all 0.2s", boxShadow: "0 4px 10px rgba(108, 99, 255, 0.3)" },
  error: { color: "#ff6b6b", marginTop: "1rem" },
};




