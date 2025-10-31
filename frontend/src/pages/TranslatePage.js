// src/pages/TranslatePage.js
import { useState } from "react";
import { useAuth } from "../context/AuthContext";

const languages = [
  { code: "en", name: "English" },
  { code: "es", name: "Spanish" },
  { code: "fr", name: "French" },
  { code: "de", name: "German" },
  { code: "hi", name: "Hindi" },
];

export default function TranslatePage() {
  const { token } = useAuth();
  const [file, setFile] = useState(null);
  const [srcLang, setSrcLang] = useState("en");
  const [tgtLang, setTgtLang] = useState("es");
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");

  const handleTranslate = async () => {
    if (!file) return;
    setProgress(0);
    setStatus("Starting translation...");
    setError("");

    const formData = new FormData();
    formData.append("file", file);
    formData.append("srcLang", srcLang);
    formData.append("tgtLang", tgtLang);

    try {
      const res = await fetch("http://localhost:8007/api/translate", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let done = false;

      while (!done) {
        const { value, done: readerDone } = await reader.read();
        done = readerDone;
        buffer += decoder.decode(value || new Uint8Array(), { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop();

        for (let line of lines) {
          if (!line.trim()) continue;
          const json = JSON.parse(line);
          if (json.progress) setProgress(json.progress);
          if (json.srt_file) {
            setStatus(`Translation complete! Files: ${json.srt_file}`);
          }
        }
      }
    } catch (err) {
      console.error(err);
      setError("Translation failed. Check console for details.");
      setStatus("");
    }
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.heading}>Translate SRT</h2>

      <div style={styles.row}>
        <label>Source Language:</label>
        <select value={srcLang} onChange={e => setSrcLang(e.target.value)} style={styles.select}>
          {languages.map(lang => (
            <option key={lang.code} value={lang.code}>{lang.name}</option>
          ))}
        </select>
      </div>

      <div style={styles.row}>
        <label>Target Language:</label>
        <select value={tgtLang} onChange={e => setTgtLang(e.target.value)} style={styles.select}>
          {languages.map(lang => (
            <option key={lang.code} value={lang.code}>{lang.name}</option>
          ))}
        </select>
      </div>

      <input type="file" accept=".srt" onChange={e => setFile(e.target.files[0])} style={styles.fileInput} />

      <button onClick={handleTranslate} disabled={!file} style={styles.button}>
        Translate
      </button>

      {progress > 0 && (
        <div style={styles.progressContainer}>
          <progress value={progress} max={1} style={styles.progressBar} />
          <span>{Math.round(progress * 100)}%</span>
        </div>
      )}

      {status && <p style={styles.status}>{status}</p>}
      {error && <p style={styles.error}>{error}</p>}
    </div>
  );
}

const styles = {
  container: { maxWidth: "600px", margin: "50px auto", padding: "20px", border: "1px solid #ddd", borderRadius: "10px", fontFamily: "Arial, sans-serif" },
  heading: { textAlign: "center", marginBottom: "20px" },
  row: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px" },
  select: { padding: "5px 10px", fontSize: "16px" },
  fileInput: { display: "block", margin: "20px auto" },
  button: { display: "block", margin: "10px auto", padding: "10px 20px", fontSize: "16px", cursor: "pointer", backgroundColor: "#007bff", color: "white", border: "none", borderRadius: "5px" },
  progressContainer: { display: "flex", alignItems: "center", gap: "10px", marginTop: "20px" },
  progressBar: { flex: 1, height: "15px" },
  status: { textAlign: "center", marginTop: "15px", fontWeight: "bold" },
  error: { textAlign: "center", marginTop: "15px", color: "red" },
};


