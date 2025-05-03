// src/pages/AdminUsers.jsx
import React, { useState, useEffect } from "react";
import { API_BASE } from "../config"; // adjust if your path is different


const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ text: "", type: "" });
  const [deleteUser, setDeleteUser] = useState(null);
  const [editUser, setEditUser] = useState(null);
  const [editForm, setEditForm] = useState({ username: "", email: "", role: "user" });

  const token = localStorage.getItem("token");

  // load users
  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}?action=get_all_users`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setUsers(data.users || []);
    } catch {
      setMessage({ text: "Failed to load users", type: "danger" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleDelete = async () => {
    try {
      const res = await fetch(`${API_BASE}?action=delete_user`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ user_id: deleteUser.id }),
      });
      const data = await res.json();
      if (res.ok) {
        setUsers((u) => u.filter((x) => x.id !== deleteUser.id));
        setMessage({ text: "User deleted", type: "success" });
      } else {
        setMessage({ text: data.message || "Delete failed", type: "danger" });
      }
    } catch {
      setMessage({ text: "Delete error", type: "danger" });
    } finally {
      setDeleteUser(null);
      setTimeout(() => setMessage({ text: "", type: "" }), 3000);
    }
  };

  // open edit modal
  const openEdit = (u) => {
    setEditUser(u);
    setEditForm({ username: u.username, email: u.email, role: u.role });
  };

  const handleSave = async () => {
    try {
      const res = await fetch(`${API_BASE}?action=update_user`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          user_id: editUser.id,
          username: editForm.username,
          email: editForm.email,
          role: editForm.role,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setUsers((u) =>
          u.map((x) =>
            x.id === editUser.id ? { ...x, ...editForm } : x
          )
        );
        setMessage({ text: "User updated", type: "success" });
      } else {
        setMessage({ text: data.message || "Update failed", type: "danger" });
      }
    } catch {
      setMessage({ text: "Update error", type: "danger" });
    } finally {
      setEditUser(null);
      setTimeout(() => setMessage({ text: "", type: "" }), 3000);
    }
  };

  return (
    <>
      <h3 className="text-light mb-3">Manage Users</h3>
      {message.text && (
        <div className={`alert alert-${message.type} alert-sm text-center`}>
          {message.text}
        </div>
      )}

      <div className="card bg-dark border-0 neon-glow p-4">
        {loading ? (
          <p className="text-light">Loading…</p>
        ) : users.length === 0 ? (
          <p className="text-light">No users found.</p>
        ) : (
          <table className="table table-dark table-striped align-middle">
            <thead>
              <tr>
                <th>ID</th>
                <th>Username</th>
                <th>Email</th>
                <th>Role</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td>{u.id}</td>
                  <td>{u.username}</td>
                  <td>{u.email}</td>
                  <td>{u.role}</td>
                  <td className="d-flex gap-2">
                    <button
                      className="btn btn-sm btn-outline-warning"
                      onClick={() => openEdit(u)}
                    >
                      Edit
                    </button>
                    <button
                      className="btn btn-sm btn-outline-danger"
                      onClick={() => setDeleteUser(u)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* DELETE USER MODAL */}
      {deleteUser && (
        <div className="modal fade show" style={{ display: "block" }}>
          <div className="modal-backdrop fade show"></div>
          <div className="modal-dialog modal-dialog-centered" style={{ zIndex: 2000 }}>
            <div className="modal-content bg-dark text-light neon-glow border-0">
              <div className="modal-header">
                <h5 className="modal-title">Delete User?</h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => setDeleteUser(null)}
                />
              </div>
              <div className="modal-body">
                Are you sure you want to delete:&nbsp;
                <strong>{deleteUser.username}</strong>?
              </div>
              <div className="modal-footer">
                <button
                  className="btn btn-sm btn-outline-light"
                  onClick={() => setDeleteUser(null)}
                >
                  Cancel
                </button>
                <button className="btn btn-sm btn-danger" onClick={handleDelete}>
                  Yes, Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* EDIT USER MODAL */}
      {editUser && (
        <div className="modal fade show" style={{ display: "block" }}>
          <div className="modal-backdrop fade show"></div>
          <div className="modal-dialog modal-dialog-centered" style={{ zIndex: 2000 }}>
            <div className="modal-content bg-dark text-light neon-glow border-0">
              <div className="modal-header">
                <h5 className="modal-title">Edit User</h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => setEditUser(null)}
                />
              </div>
              <div className="modal-body">
                <div className="mb-2">
                  <label className="form-label">Username</label>
                  <input
                    className="form-control form-control-sm"
                    value={editForm.username}
                    onChange={(e) =>
                      setEditForm((f) => ({ ...f, username: e.target.value }))
                    }
                  />
                </div>
                <div className="mb-2">
                  <label className="form-label">Email</label>
                  <input
                    type="email"
                    className="form-control form-control-sm"
                    value={editForm.email}
                    onChange={(e) =>
                      setEditForm((f) => ({ ...f, email: e.target.value }))
                    }
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Role</label>
                  <select
                    className="form-select form-select-sm"
                    value={editForm.role}
                    onChange={(e) =>
                      setEditForm((f) => ({ ...f, role: e.target.value }))
                    }
                  >
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
              </div>
              <div className="modal-footer">
                <button
                  className="btn btn-sm btn-outline-light"
                  onClick={() => setEditUser(null)}
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

export default AdminUsers;
