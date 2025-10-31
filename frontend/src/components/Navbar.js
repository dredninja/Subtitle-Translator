// src/components/Navbar.js
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <nav style={styles.nav}>
      <div style={styles.logo}>
        <Link to="/" style={styles.linkLogo}>
          Subtitle Translator
        </Link>
      </div>

      <div style={styles.menu}>
        <Link to="/translate" style={styles.link}>
          Translate
        </Link>
        <Link to="/similarity" style={styles.link}>
          Similarity
        </Link>
        <Link to="/manual-review" style={styles.link}>
          Manual Review
        </Link>
        <Link to="/about" style={styles.link}>
          About
        </Link>

        {user ? (
          <div style={{ position: "relative" }}>
            <button
              style={styles.accountBtn}
              onClick={() => setDropdownOpen(!dropdownOpen)}
            >
              {user.username} ▼
            </button>

            {dropdownOpen && (
              <div style={styles.dropdownContent}>
                <button
                  onClick={() => {
                    setDropdownOpen(false);
                    navigate("/profile");
                  }}
                  style={styles.dropdownItem}
                >
                  Profile
                </button>
                <button onClick={handleLogout} style={styles.dropdownItem}>
                  Logout
                </button>
              </div>
            )}
          </div>
        ) : (
          <Link to="/login" style={styles.link}>
            Login
          </Link>
        )}
      </div>
    </nav>
  );
}

const styles = {
  nav: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "1rem 2rem",
    backgroundColor: "#667eea", // modern soft blue
    color: "#fff",
    boxShadow: "0 8px 20px rgba(0,0,0,0.15)",
    position: "sticky",
    top: 0,
    zIndex: 100,
    fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
  },
  logo: {
    fontWeight: "700",
    fontSize: "1.6rem",
    color: "#fff",
  },
  linkLogo: {
    color: "#fff",
    textDecoration: "none",
  },
  menu: {
    display: "flex",
    alignItems: "center",
    gap: "1rem",
  },
  link: {
    color: "#fff",
    textDecoration: "none",
    padding: "0.6rem 1.2rem",
    borderRadius: "15px",
    fontWeight: 500,
    transition: "background 0.2s ease",
  },
  linkHover: {
    backgroundColor: "rgba(255,255,255,0.2)",
  },
  accountBtn: {
    background: "rgba(255,255,255,0.2)",
    border: "none",
    color: "#fff",
    cursor: "pointer",
    padding: "0.6rem 1.2rem",
    fontSize: "1rem",
    borderRadius: "15px",
    fontWeight: "500",
    transition: "background 0.2s ease",
  },
  accountBtnHover: {
    background: "rgba(255,255,255,0.35)",
  },
  dropdownContent: {
    position: "absolute",
    top: "110%",
    right: 0,
    backgroundColor: "#fff",
    color: "#333",
    minWidth: "160px",
    boxShadow: "0 10px 25px rgba(0,0,0,0.15)",
    borderRadius: "12px",
    overflow: "hidden",
    zIndex: 200,
  },
  dropdownItem: {
    display: "block",
    width: "100%",
    padding: "0.8rem 1rem",
    background: "none",
    border: "none",
    textAlign: "left",
    cursor: "pointer",
    fontWeight: 500,
    transition: "background 0.2s ease",
  },
  dropdownItemHover: {
    backgroundColor: "#f0f0f0",
  },
};


// Optional: you can add hover effects via inline onMouseEnter/onMouseLeave or use CSS modules
