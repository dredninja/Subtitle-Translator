import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import bgImage from "../resources/Register.png"; // placeholder

export default function RegisterPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    username: "",
    email: "",
    purpose: "",
    fullName: "",
    phone: "",
    dob: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleNext = () => {
    if (step === 1 && (!form.username || !form.email))
      return setError("Enter username and email");
    if (step === 2 && !form.purpose) return setError("Enter purpose");
    setError("");
    setStep(step + 1);
  };

  const handlePrev = () => setStep(step - 1);

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async () => {
    if (!form.password) return setError("Enter password");
    setError("");
    setLoading(true);

    try {
      await axios.post("http://localhost:8007/api/register", form);
      navigate("/login");
    } catch (err) {
      console.error("Axios error response:", err.response);
      setError(err.response?.data?.error || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <h2 style={styles.heading}>Create Your Account</h2>
        {error && <p style={styles.error}>{error}</p>}

        {step === 1 && (
          <div style={styles.step}>
            <input
              name="username"
              placeholder="Username"
              value={form.username}
              onChange={handleChange}
              style={styles.input}
            />
            <input
              name="email"
              type="email"
              placeholder="Email"
              value={form.email}
              onChange={handleChange}
              style={styles.input}
            />
          </div>
        )}

        {step === 2 && (
          <div style={styles.step}>
            <input
              name="purpose"
              placeholder="Purpose"
              value={form.purpose}
              onChange={handleChange}
              style={styles.input}
            />
          </div>
        )}

        {step === 3 && (
          <div style={styles.step}>
            <input
              name="fullName"
              placeholder="Full Name"
              value={form.fullName}
              onChange={handleChange}
              style={styles.input}
            />
            <input
              name="phone"
              placeholder="Phone Number"
              value={form.phone}
              onChange={handleChange}
              style={styles.input}
            />
            <input
              name="dob"
              type="date"
              placeholder="Date of Birth"
              value={form.dob}
              onChange={handleChange}
              style={styles.input}
            />
          </div>
        )}

        {step === 4 && (
          <div style={styles.step}>
            <input
              name="password"
              type="password"
              placeholder="Password"
              value={form.password}
              onChange={handleChange}
              style={styles.input}
            />
          </div>
        )}

        <div style={styles.buttons}>
          {step > 1 && (
            <button onClick={handlePrev} style={styles.buttonSecondary}>
              Previous
            </button>
          )}
          {step < 4 && (
            <button onClick={handleNext} style={styles.buttonPrimary}>
              Next
            </button>
          )}
          {step === 4 && (
            <button
              onClick={handleSubmit}
              style={styles.buttonPrimary}
              disabled={loading}
            >
              {loading ? "Registering..." : "Register"}
            </button>
          )}
        </div>

        <p style={styles.switch}>
          Already have an account?{" "}
          <span
            style={styles.link}
            onClick={() => navigate("/login")}
          >
            Login here
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
  background: "rgba(255,255,255,0.15)",
  borderRadius: "16px",
  padding: "40px",
  width: "60%",        // responsive width
  maxWidth: "400px",   // optional max width
  margin: "60px auto",
  boxShadow: "0 8px 30px rgba(0,0,0,0.25)",
  backdropFilter: "glass(10px)",
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
  inputFocus: {
    borderColor: "#007bff",
  },
  buttons: {
    display: "flex",
    justifyContent: "space-between",
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
    marginLeft: "5px",
    transition: "0.2s background",
  },
  buttonSecondary: {
    padding: "12px 25px",
    borderRadius: "12px",
    border: "1px solid #007bff",
    backgroundColor: "#fff",
    color: "#007bff",
    fontWeight: "600",
    cursor: "pointer",
    flex: 1,
    marginRight: "5px",
    transition: "0.2s background, 0.2s color",
  },
  error: { color: "#d9534f", textAlign: "center", marginBottom: "15px" },
  step: { marginBottom: "20px" },
  switch: { textAlign: "center", marginTop: "20px", color: "#fffefeff" },
  link: { color: "#007bff", cursor: "pointer", fontWeight: "600" },
};

