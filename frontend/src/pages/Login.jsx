// Login.jsx
import React, { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch("http://localhost/re-quiz-app/backend/index.php?action=login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json();
      if (response.ok && data.token) {
        login(data.token);
        navigate("/profile");
      } else {
        setMessage(data.message || "Login failed");
      }
    } catch (err) {
      setMessage("Error: " + err.message);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="d-flex flex-column">
      <input
        type="email"
        name="email"
        className="form-control mb-3"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />
      <input
        type="password"
        name="password"
        className="form-control mb-4"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
      />
      <button type="submit" className="btn w-100">Log in</button>
      {message && <p className="mt-3 text-danger text-center">{message}</p>}
    </form>
  );
};

export default Login;