// Auth.jsx
import React, { useState } from "react";
import Login from "./Login";
import Register from "./Register";
import logo from "../assets/relogo.png";
import "../styles/LoginSignup.css";

const Auth = () => {
  const [mode, setMode] = useState("login"); 

  return (
    <div className="login-container">
      <div className="login-left">
        <div className="login-card">
          <div className="text-center mb-4">
            <img src={logo} alt="ReQuiz Logo" className="logo" />
          </div>
          <div className="nav-btns">
            <button
              onClick={() => setMode("login")}
              className={mode === "login" ? "active" : ""}
            >
              Login
            </button>
            <button
              onClick={() => setMode("register")}
              className={mode === "register" ? "active" : ""}
            >
              Register
            </button>
          </div>
          {mode === "login" ? <Login /> : <Register />}
        </div>
      </div>
    </div>
  );
};

export default Auth;