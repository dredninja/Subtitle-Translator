// src/pages/ManualReviewPage.js
import React from "react";
import { useLocation, useNavigate } from "react-router-dom";

export default function ManualReviewPage() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const report = state?.report || [];
  const threshold = parseFloat(state?.threshold || 0.7);

  const lowSimLines = report.filter(line => line.similarity < threshold);

  return (
    <div style={styles.pageContainer}>
      <h2 style={styles.title}>Manual Review: Low Similarity Lines</h2>
      <p style={styles.description}>
        Lines below threshold ({threshold}) are shown here for manual inspection.
      </p>

      {lowSimLines.length === 0 ? (
        <p style={styles.noIssues}>All lines are above threshold ✅</p>
      ) : (
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Index</th>
              <th style={styles.th}>Original</th>
              <th style={styles.th}>Translated</th>
              <th style={styles.th}>Back-Translated</th>
              <th style={styles.th}>Similarity</th>
            </tr>
          </thead>
          <tbody>
            {lowSimLines.map(line => (
              <tr key={line.index}>
                <td style={styles.td}>{line.index}</td>
                <td style={styles.td}>{line.original}</td>
                <td style={styles.td}>{line.translated}</td>
                <td style={styles.td}>{line.back_translated}</td>
                <td style={styles.td}>{line.similarity.toFixed(3)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <button style={styles.button} onClick={() => navigate("/similarity")}>
        ← Back to Similarity Checker
      </button>
    </div>
  );
}

const styles = {
  pageContainer: { fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif", padding: "2rem", minHeight: "100vh", backgroundColor: "#f5f6fa" },
  title: { fontSize: "1.8rem", fontWeight: "bold", marginBottom: "0.5rem", color: "#333" },
  description: { fontSize: "1rem", marginBottom: "1.5rem", color: "#555" },
  noIssues: { fontSize: "1rem", color: "#4caf50", fontWeight: "bold" },
  table: { width: "100%", borderCollapse: "collapse", marginBottom: "1.5rem" },
  button: { padding: "0.8rem 1.2rem", borderRadius: "30px", backgroundColor: "#6c63ff", color: "#fff", border: "none", cursor: "pointer", fontWeight: "bold", boxShadow: "0 4px 10px rgba(108, 99, 255, 0.3)" },
  th: { borderBottom: "1px solid #ccc", padding: "0.5rem", textAlign: "left", backgroundColor: "#e0e0e0" },
  td: { borderBottom: "1px solid #ccc", padding: "0.5rem" },
};

