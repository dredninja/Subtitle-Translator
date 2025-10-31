// src/pages/LoginPage.js
import React, { useState } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import bgImage from "../resources/Login.jpg"; // placeholder

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    if (!username || !password) return setError("Enter username & password");

    setLoading(true);
    try {
      const res = await axios.post("http://localhost:8007/api/login", { username, password });
      login(res.data); // store token + username
      navigate("/translate");
    } catch (err) {
      setError(err.response?.data?.error || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <h2 style={styles.heading}>Login to Your Account</h2>
        {error && <p style={styles.error}>{error}</p>}

        <div style={styles.step}>
          <input
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            style={styles.input}
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={styles.input}
          />
        </div>

        <div style={styles.buttons}>
          <button
            onClick={handleLogin}
            style={styles.buttonPrimary}
            disabled={loading}
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </div>

        <p style={styles.switch}>
          Don't have an account?{" "}
          <span style={styles.link} onClick={() => navigate("/register")}>
            Register here
          </span>
        </p>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    backgroundImage: `url(${bgImage})`,
    backgroundSize: "cover",
    backgroundPosition: "center",
    display: "flex",
    justifyContent: "center",
    alignItems: "flex-start",
    paddingTop: "80px",
    fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
  },
  container: {
    background: "rgba(255, 255, 255, 0.21)",
    borderRadius: "16px",
    padding: "40px",
    width: "60%",        // responsive width
    maxWidth: "400px",
    margin: "60px auto",
    boxShadow: "0 8px 30px rgba(0, 0, 0, 0.64)",
    backdropFilter: "blur(5px)", // fixed glass effect
    border: "2px solid rgba(255,255,255,0.2)",
  },
  heading: {
    textAlign: "center",
    marginBottom: "25px",
    fontSize: "28px",
    color: "rgba(255, 255, 255, 1)",
    fontWeight: "700",
  },
  input: {
    display: "block",
    width: "100%",
    marginBottom: "18px",
    padding: "12px 15px",
    fontSize: "16px",
    borderRadius: "12px",
    border: "1px solid #ddd",
    outline: "none",
    transition: "0.2s border-color",
  },
  buttons: {
    display: "flex",
    justifyContent: "center",
    marginTop: "10px",
  },
  buttonPrimary: {
    padding: "12px 25px",
    borderRadius: "12px",
    border: "none",
    backgroundColor: "#007bff",
    color: "#fff",
    fontWeight: "600",
    cursor: "pointer",
    flex: 1,
    transition: "0.2s background",
  },
  error: { color: "#d9534f", textAlign: "center", marginBottom: "15px" },
  step: { marginBottom: "20px" },
  switch: { textAlign: "center", marginTop: "20px", color: "#343232ff" },
  link: { color: "#007bff", cursor: "pointer", fontWeight: "600" },
};





