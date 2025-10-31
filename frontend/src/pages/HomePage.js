// src/pages/HomePage.js
import React from "react";
import { Link } from "react-router-dom";

const HomePage = () => {
  return (
    <div style={styles.pageContainer}>
      {/* Hero Section */}
      <section style={styles.hero}>
        <h1 style={styles.heroTitle}>Your Subtitle, Your Language</h1>
        <p style={styles.heroText}>
          Translate SRT files instantly, check similarity, and manage subtitles efficiently. 
          Make your video content accessible in any language.
        </p>
        <div style={styles.heroButtons}>
          <Link to="/translate" style={{ ...styles.button, backgroundColor: "#ff6b6b" }}>Translate Now</Link>
          <Link to="/similarity" style={{ ...styles.button, backgroundColor: "#4ecdc4" }}>Check Similarity</Link>
        </div>
      </section>

      {/* Features Section */}
      <section style={styles.features}>
        <div style={styles.featureCard}>
          <h3>Fast Translation</h3>
          <p>Translate subtitles in multiple languages instantly with accurate context.</p>
        </div>
        <div style={styles.featureCard}>
          <h3>Similarity Check</h3>
          <p>Ensure your translated subtitles preserve meaning and timing accurately.</p>
        </div>
        <div style={styles.featureCard}>
          <h3>User Friendly</h3>
          <p>Easy-to-use interface designed for video creators and translators alike.</p>
        </div>
      </section>

      {/* Footer */}
      <footer style={styles.footer}>
        <p>© 2025 Subtitle Translator. All rights reserved.</p>
      </footer>
    </div>
  );
};

const styles = {
  pageContainer: {
    fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
    color: "#333",
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column",
    backgroundColor: "#f9f9f9",
  },
  hero: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    textAlign: "center",
    padding: "6rem 2rem",
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    color: "#fff",
    borderRadius: "0 0 50% 50% / 25%",
    boxShadow: "0 8px 20px rgba(0,0,0,0.15)",
  },
  heroTitle: {
    fontSize: "3rem",
    fontWeight: "900",
    marginBottom: "1rem",
    letterSpacing: "1px",
  },
  heroText: {
    fontSize: "1.3rem",
    maxWidth: "700px",
    marginBottom: "2.5rem",
    lineHeight: "1.6",
  },
  heroButtons: {
    display: "flex",
    gap: "1.5rem",
    flexWrap: "wrap",
  },
  button: {
    padding: "0.9rem 2.2rem",
    borderRadius: "50px",
    color: "white",
    fontWeight: "700",
    textDecoration: "none",
    fontSize: "1rem",
    boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
    transition: "all 0.3s ease",
  },
  features: {
    display: "flex",
    justifyContent: "center",
    gap: "2rem",
    flexWrap: "wrap",
    padding: "4rem 2rem",
    backgroundColor: "#fff",
  },
  featureCard: {
    flex: "1 1 250px",
    backgroundColor: "#f1f5f9",
    borderRadius: "20px",
    padding: "2rem",
    textAlign: "center",
    boxShadow: "0 6px 15px rgba(0,0,0,0.08)",
    transition: "transform 0.3s ease, box-shadow 0.3s ease",
    cursor: "default",
  },
  featureCardHover: {
    transform: "translateY(-5px)",
    boxShadow: "0 12px 25px rgba(0,0,0,0.15)",
  },
  footer: {
    textAlign: "center",
    padding: "1.5rem",
    backgroundColor: "#333",
    color: "#fff",
    fontSize: "0.9rem",
  },
};

export default HomePage;

