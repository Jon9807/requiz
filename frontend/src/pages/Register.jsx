// Register.jsx
import React, { useState } from "react"
import { API_BASE } from "../config"

const Register = () => {
  const [form, setForm] = useState({
    username: "",
    email: "",
    password: ""
  })
  const [messageText, setMessageText] = useState("")
  const [messageType, setMessageType] = useState("danger")

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    try {
      const response = await fetch(`${API_BASE}?action=register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      })
      const data = await response.json()

      if (response.ok) {
        setMessageType("success")
      } else {
        setMessageType("danger")
      }

      setMessageText(data.message)
    } catch (err) {
      setMessageType("danger")
      setMessageText("Error: " + err.message)
    }
  }

  return (
    <div className="glass-panel p-4 login-card">
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

        {messageText && (
          <p className={`mt-3 text-${messageType} text-center`}>
            {messageText}
          </p>
        )}
      </form>
    </div>
  )
}

export default Register
