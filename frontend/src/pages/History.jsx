// src/pages/History.jsx
import React, { useState, useEffect, useContext } from "react"
import { AuthContext } from "../context/AuthContext"
import "../styles/History.css"
import { API_BASE } from "../config" 

// custom confirm dialog
const ConfirmDialog = ({ show, title, message, onConfirm, onCancel }) => {
  if (!show) return null
  return (
    <div
      className="d-flex justify-content-center align-items-center"
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        backgroundColor: "rgba(0,0,0,0.6)",
        zIndex: 1050,
      }}
    >
      <div
        className="neon-border p-4 bg-dark rounded"
        style={{ maxWidth: "400px", width: "90%" }}
      >
        <h5 className="text-light mb-2">{title}</h5>
        <p className="text-light mb-4">{message}</p>
        <div className="d-flex justify-content-end gap-2">
          <button className="btn btn-sm btn-danger" onClick={onConfirm}>
            Yes
          </button>
          <button
            className="btn btn-sm btn-outline-light"
            onClick={onCancel}
          >
            No
          </button>
        </div>
      </div>
    </div>
  )
}

const History = () => {
  const { token } = useContext(AuthContext)
  const [sessions, setSessions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [deletingId, setDeletingId] = useState(null)

  // load history
  useEffect(() => {
    if (!token) {
      setLoading(false)
      return
    }
    fetch(`${API_BASE}/index.php?action=get_user_sessions`, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.sessions) {
          setSessions(data.sessions)
        } else {
          setError(data.message || "Unable to load your history.")
        }
      })
      .catch(() => setError("Network error loading your history."))
      .finally(() => setLoading(false))
  }, [token])

  // request delete
  const handleDelete = (id) => setDeletingId(id)

  // confirm deletion
  const confirmDelete = () => {
    fetch(`${API_BASE}/index.php?action=delete_session`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ session_id: deletingId }),
    })
      .then((res) => {
        if (!res.ok) throw new Error()
        setSessions((list) => list.filter((s) => s.id !== deletingId))
      })
      .catch(() => {})
      .finally(() => setDeletingId(null))
  }

  return (
    <div className="container mt-5 text-light">
      <h2 className="mb-4 text-center">My Quiz History</h2>

      {loading ? (
        <p>Loading your history…</p>
      ) : error ? (
        <p className="text-danger">{error}</p>
      ) : sessions.length === 0 ? (
        <p>You haven’t completed any quizzes yet.</p>
      ) : (
        <table className="table table-dark table-striped">
          <thead>
            <tr>
              <th>Date</th>
              <th>Time</th>
              <th>Quiz</th>
              <th>Category</th>
              <th>Score</th>
              <th># Questions</th>
              <th>Duration (s)</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {sessions.map((s) => {
              const dt = new Date(s.created_at)
              const dateOnly = dt.toLocaleDateString()
              const timeOnly = dt.toLocaleTimeString()

              return (
                <tr key={s.id}>
                  <td data-label="Date">{dateOnly}</td>
                  <td data-label="Time">{timeOnly}</td>
                  <td data-label="Quiz">{s.quiz_name || "—"}</td>
                  <td data-label="Category">{s.category_name}</td>
                  <td data-label="Score">{s.score}</td>
                  <td data-label="# Questions">{s.questions_answered}</td>
                  <td data-label="Duration (s)">{s.duration_seconds}</td>
                  <td data-label="Actions">
                    <button
                      className="btn btn-sm btn-outline-danger"
                      onClick={() => handleDelete(s.id)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      )}

      <ConfirmDialog
        show={deletingId != null}
        title="Delete this entry?"
        message="This cannot be undone."
        onConfirm={confirmDelete}
        onCancel={() => setDeletingId(null)}
      />
    </div>
  )
}

export default History
