// src/pages/ProfilePage.js
import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import axios from "axios";

export default function ProfilePage() {
  const { token } = useAuth();
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await axios.get("http://localhost:8007/api/profile", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setProfileData(res.data);
      } catch (err) {
        console.error(err);
        setError("Failed to load profile data.");
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [token]);

  if (loading) return <p style={{ padding: "2rem" }}>Loading...</p>;
  if (error) return <p style={{ padding: "2rem", color: "red" }}>{error}</p>;

  const { user, translations, similarities } = profileData;

  return (
    <div style={styles.container}>
      <h2>Your Profile</h2>
      <div style={styles.profileInfo}>
        <p><strong>Username:</strong> {user.username}</p>
        <p><strong>Email:</strong> {user.email}</p>
        <p><strong>Purpose:</strong> {user.purpose}</p>
        <p><strong>Last Login:</strong> {new Date(user.lastLogin).toLocaleString()}</p>
      </div>

      {/* Translations Section */}
      <div style={styles.section}>
        <h3>Past Translations ({translations.length})</h3>
        {translations.length === 0 ? (
          <p>No translations yet.</p>
        ) : (
          <ul style={styles.list}>
            {translations.map(t => (
              <li key={t._id} style={styles.listItem}>
                <div>
                  <strong>Src → Tgt:</strong> {t.srcLang} → {t.tgtLang} | 
                  <strong>Date:</strong> {new Date(t.createdAt).toLocaleString()}
                </div>
                <div style={styles.links}>
                  <a href={`/downloads/${t.translatedFile.split("/").pop()}`} target="_blank" rel="noreferrer">SRT File</a>
                  <a href={`/downloads/${t.jsonReport.split("/").pop()}`} target="_blank" rel="noreferrer">JSON Report</a>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Similarity Section */}
      <div style={styles.section}>
        <h3>Past Similarity Checks ({similarities.length})</h3>
        {similarities.length === 0 ? (
          <p>No similarity checks yet.</p>
        ) : (
          <ul style={styles.list}>
            {similarities.map(s => (
              <li key={s._id} style={styles.listItem}>
                <div>
                  <strong>Threshold:</strong> {s.threshold} | 
                  <strong>Date:</strong> {new Date(s.createdAt).toLocaleString()}
                </div>
                <div style={styles.links}>
                  <a href={`/downloads/${s.jsonReport.split("/").pop()}`} target="_blank" rel="noreferrer">JSON Report</a>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

const styles = {
  container: {
    padding: "2rem",
    fontFamily: "Segoe UI, sans-serif",
    maxWidth: "900px",
    margin: "0 auto",
  },
  profileInfo: {
    marginBottom: "2rem",
    padding: "1rem",
    background: "#f1f3f6",
    borderRadius: "10px",
  },
  section: {
    marginBottom: "2rem",
    padding: "1rem",
    background: "#fff",
    borderRadius: "10px",
    boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
  },
  list: { listStyle: "none", padding: 0, marginTop: "1rem" },
  listItem: {
    marginBottom: "1rem",
    padding: "0.8rem",
    borderBottom: "1px solid #eee",
    display: "flex",
    justifyContent: "space-between",
    flexWrap: "wrap",
  },
  links: {
    display: "flex",
    gap: "1rem",
    marginTop: "0.5rem",
  },
};
