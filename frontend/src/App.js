// src/App.js
import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";

import Navbar from "./components/Navbar";
import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import TranslatePage from "./pages/TranslatePage";
import SimilarityPage from "./pages/SimilarityPage";
import ProfilePage from "./pages/ProfilePage";
import ManualReviewPage from "./pages/ManualReviewPage";
import ProtectedRoute from "./components/ProtectedRoute";

function App() {
  return (
    <AuthProvider>
      <Router>
        <Navbar />
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          <Route
            path="/translate"
            element={
              <ProtectedRoute>
                <TranslatePage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/similarity"
            element={
              <ProtectedRoute>
                <SimilarityPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/manual-review"
            element={
              <ProtectedRoute>
                <ManualReviewPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            }
          />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;



