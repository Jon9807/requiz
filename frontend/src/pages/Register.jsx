
// Register.jsx
import React, { useState } from "react";

const Register = () => {
  const [form, setForm] = useState({ username: "", email: "", password: "" });
  const [message, setMessage] = useState("");

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch("http://localhost/re-quiz-app/backend/index.php?action=register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await response.json();
      setMessage(data.message);
    } catch (err) {
      setMessage("Error: " + err.message);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="d-flex flex-column">
      <input
        className="form-control mb-3"
        placeholder="Username"
        name="username"
        type="text"
        value={form.username}
        onChange={handleChange}
      />
      <input
        className="form-control mb-3"
        placeholder="Email"
        name="email"
        type="email"
        value={form.email}
        onChange={handleChange}
      />
      <input
        className="form-control mb-4"
        placeholder="Password"
        name="password"
        type="password"
        value={form.password}
        onChange={handleChange}
      />
      <button className="btn w-100" type="submit">
        Register
      </button>
      {message && <p className="mt-3 text-danger text-center">{message}</p>}
    </form>
  );
};

export default Register;