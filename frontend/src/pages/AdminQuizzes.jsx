// src/pages/AdminQuizzes.jsx
import React, { useState, useEffect } from "react";
import { API_BASE } from "../config";
import "../styles/admintable.css";

const AdminQuizzes = () => {
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [delQuiz, setDelQuiz] = useState(null);
  const [editQuiz, setEditQuiz] = useState(null);
  const [editForm, setEditForm] = useState({
    name: "",
    description: "",
    is_public: false,
  });
  const token = localStorage.getItem("token");

  const loadQuizzes = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}?action=get_all_quizzes`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setQuizzes(data.quizzes || []);
    } catch {
      setMessage("Failed to load quizzes");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadQuizzes();
  }, []);

  const handleDelete = async () => {
    try {
      const res = await fetch(`${API_BASE}?action=admin_delete_quiz`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ quiz_id: delQuiz.id }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage("Quiz deleted");
        setQuizzes((q) => q.filter((x) => x.id !== delQuiz.id));
      } else {
        setMessage(data.message || "Delete failed");
      }
    } catch {
      setMessage("Delete error");
    } finally {
      setDelQuiz(null);
      setTimeout(() => setMessage(""), 3000);
    }
  };

  //edit open/save
  const openEdit = (q) => {
    setEditQuiz(q);
    setEditForm({
      name: q.name,
      description: q.description,
      is_public: q.is_public === 1,
    });
  };

  const handleSave = async () => {
    try {
      const res = await fetch(`${API_BASE}?action=update_quiz`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          quiz_id: editQuiz.id,
          name: editForm.name,
          description: editForm.description,
          is_public: editForm.is_public ? 1 : 0,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage("Quiz updated");
        setQuizzes((q) =>
          q.map((x) =>
            x.id === editQuiz.id
              ? {
                  ...x,
                  name: editForm.name,
                  description: editForm.description,
                  is_public: editForm.is_public ? 1 : 0,
                }
              : x
          )
        );
      } else {
        setMessage(data.message || "Update failed");
      }
    } catch {
      setMessage("Update error");
    } finally {
      setEditQuiz(null);
      setTimeout(() => setMessage(""), 3000);
    }
  };

  return (
    <>
      <h3 className="text-light mb-3">Manage Quizzes</h3>
      {message && (
        <div className="alert alert-success alert-sm text-center">
          {message}
        </div>
      )}

      <div className="card bg-dark border-0 neon-glow p-4 mb-5">
        {loading ? (
          <p className="text-light">Loading…</p>
        ) : quizzes.length === 0 ? (
          <p className="text-light">No quizzes found.</p>
        ) : (
          <table className="table table-dark table-striped align-middle">
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Description</th>
                <th>Public</th>
                <th>Creator</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {quizzes.map((q) => (
                <tr key={q.id}>
                  <td>{q.id}</td>
                  <td>{q.name}</td>
                  <td>{q.description}</td>
                  <td>{q.is_public ? "Yes" : "No"}</td>
                  <td>{q.creator}</td>
                  <td>{new Date(q.created_at).toLocaleDateString()}</td>
                  <td
                    style={{
                      textAlign: "center",
                      verticalAlign: "middle",
                      whiteSpace: "nowrap",
                    }}
                  >
                    <div className="d-inline-flex gap-2">
                      <button
                        className="btn btn-sm btn-outline-warning"
                        onClick={() => openEdit(q)}
                      >
                        Edit
                      </button>
                      <button
                        className="btn btn-sm btn-outline-danger"
                        onClick={() => setDelQuiz(q)}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* DELETE Modal */}
      {delQuiz && (
        <div className="modal fade show" style={{ display: "block" }}>
          <div className="modal-backdrop fade show"></div>
          <div
            className="modal-dialog modal-dialog-centered"
            style={{ zIndex: 2000 }}
          >
            <div className="modal-content bg-dark text-light neon-glow border-0">
              <div className="modal-header">
                <h5 className="modal-title">Delete Quiz?</h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => setDelQuiz(null)}
                />
              </div>
              <div className="modal-body">
                Are you sure you want to delete <strong>{delQuiz.name}</strong>?
                <br />
                This action cannot be undone.
              </div>
              <div className="modal-footer">
                <button
                  className="btn btn-sm btn-outline-light"
                  onClick={() => setDelQuiz(null)}
                >
                  Cancel
                </button>
                <button
                  className="btn btn-sm btn-danger"
                  onClick={handleDelete}
                >
                  Yes, Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* EDIT Modal */}
      {editQuiz && (
        <div className="modal fade show" style={{ display: "block" }}>
          <div className="modal-backdrop fade show"></div>
          <div
            className="modal-dialog modal-dialog-centered"
            style={{ zIndex: 2000 }}
          >
            <div className="modal-content bg-dark text-light neon-glow border-0">
              <div className="modal-header">
                <h5 className="modal-title">Edit Quiz</h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => setEditQuiz(null)}
                />
              </div>
              <div className="modal-body">
                <div className="mb-3">
                  <label className="form-label">Name</label>
                  <input
                    className="form-control form-control-sm"
                    value={editForm.name}
                    onChange={(e) =>
                      setEditForm((f) => ({ ...f, name: e.target.value }))
                    }
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Description</label>
                  <textarea
                    rows={2}
                    className="form-control form-control-sm"
                    value={editForm.description}
                    onChange={(e) =>
                      setEditForm((f) => ({
                        ...f,
                        description: e.target.value,
                      }))
                    }
                  />
                </div>
                <div className="form-check">
                  <input
                    id="editPublic"
                    type="checkbox"
                    className="form-check-input"
                    checked={editForm.is_public}
                    onChange={(e) =>
                      setEditForm((f) => ({
                        ...f,
                        is_public: e.target.checked,
                      }))
                    }
                  />
                  <label htmlFor="editPublic" className="form-check-label">
                    Make Public
                  </label>
                </div>
              </div>
              <div className="modal-footer">
                <button
                  className="btn btn-sm btn-outline-light"
                  onClick={() => setEditQuiz(null)}
                >
                  Cancel
                </button>
                <button className="btn btn-sm btn-success" onClick={handleSave}>
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AdminQuizzes;
