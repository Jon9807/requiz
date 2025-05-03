// src/components/Navbar.jsx
import React, { useContext } from "react";
import { NavLink } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

import "../styles/Navbar.css";
import { API_BASE } from "../config";

import logo from "../assets/relogo.png";

export default function Navbar() {
  const { token, user, ready } = useContext(AuthContext);

  if (!ready) return null;

  const avatarUrl =
    token && user && user.profile_pic
      ? `${API_BASE.replace("/index.php", "")}/${user.profile_pic}`
      : null;

  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-dark">
      <div className="container-fluid">
        <NavLink className="navbar-brand d-flex align-items-center" to="/">
          <img
            src={logo}
            alt="ReQuiz Logo"
            style={{
              height: "40px",
              transform: "scale(1.5)",
              transformOrigin: "left center",
              padding: 0,
              margin: 0,
            }}
          />
        </NavLink>

        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navbarNav"
          aria-controls="navbarNav"
          aria-expanded="false"
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon" />
        </button>

        <div className="collapse navbar-collapse" id="navbarNav">
          <ul className="navbar-nav mx-auto">
            {/* Always visible */}
            <li className="nav-item">
              <NavLink end className="nav-link" to="/">
                Home
              </NavLink>
            </li>

            {/* User-only */}
            {token && user && (
              <>
                <li className="nav-item">
                  <NavLink className="nav-link" to="/user-quizzes">
                    My Quizzes
                  </NavLink>
                </li>
                <li className="nav-item">
                  <NavLink className="nav-link" to="/create-quiz">
                    Create Quiz
                  </NavLink>
                </li>
                <li className="nav-item">
                  <NavLink className="nav-link" to="/history">
                    My Scores
                  </NavLink>
                </li>
              </>
            )}

            {/* Always visible */}
            <li className="nav-item">
              <NavLink className="nav-link" to="/public-quizzes">
                Public Quizzes
              </NavLink>
            </li>
            <li className="nav-item">
              <NavLink className="nav-link" to="/generate-quiz">
                Generate Quiz
              </NavLink>
            </li>
            <li className="nav-item">
              <NavLink className="nav-link" to="/about">
                About
              </NavLink>
            </li>

            {/* Admin-only */}
            {token && user?.role === "admin" && (
              <li className="nav-item">
                <NavLink className="nav-link" to="/admin">
                  Admin Panel
                </NavLink>
              </li>
            )}
          </ul>

          <ul className="navbar-nav ms-auto">
            {token ? (
              <li className="nav-item">
                <NavLink to="/profile" className="nav-link p-0">
                  {avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt="Profile"
                      style={{
                        width: "32px",
                        height: "32px",
                        borderRadius: "50%",
                        objectFit: "cover",
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        width: "32px",
                        height: "32px",
                        borderRadius: "50%",
                        background: "rgba(14,14,20,0.6)",
                        border: "2px solid rgba(255,38,126,0.6)",
                        boxShadow: "0 0 8px rgba(255,38,126,0.8)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "#fff",
                        fontWeight: "bold",
                        fontSize: "1rem",
                        lineHeight: 1,
                      }}
                    >
                      ?
                    </div>
                  )}
                </NavLink>
              </li>
            ) : (
              <li className="nav-item">
                <NavLink className="nav-link" to="/auth">
                  Login / Register
                </NavLink>
              </li>
            )}
          </ul>
        </div>
      </div>
    </nav>
  );
}
