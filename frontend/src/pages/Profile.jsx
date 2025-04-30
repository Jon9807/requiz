// src/pages/Profile.jsx

import React, { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import "../styles/Profile.css";

const API_BASE = "http://localhost/re-quiz-app";

export default function Profile() {
  const { logout, token } = useContext(AuthContext);
  const navigate = useNavigate();

  const [form, setForm] = useState({
    username: "",
    email: "",
    bio: "",
  });
  const [avatarUrl, setAvatarUrl] = useState(null);
  const [fileInput, setFileInput] = useState(null);
  const [removeAvatar, setRemoveAvatar] = useState(false);
  const [message, setMessage] = useState("");

  // Fetch current profile on mount
  useEffect(() => {
    if (!token) {
      navigate("/auth");
      return;
    }
    fetch(`${API_BASE}/backend/index.php?action=get_profile`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.json())
      .then(data => {
        if (data.username) {
          setForm({
            username: data.username,
            email: data.email,
            bio: data.bio || "",
          });
          if (data.profile_pic) {
            setAvatarUrl(`${API_BASE}/backend/${data.profile_pic}`);
          }
        } else {
          setMessage(data.message || "Failed to load profile");
        }
      })
      .catch(() => setMessage("Failed to load profile"));
  }, [token, navigate]);

  // Handle text field changes
  const handleChange = e => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
  };

  // Handle new file selection & preview
  const handleFile = e => {
    const file = e.target.files[0];
    setFileInput(file);
    setRemoveAvatar(false);
    if (file) {
      const reader = new FileReader();
      reader.onload = () => setAvatarUrl(reader.result);
      reader.readAsDataURL(file);
    }
  };

  // Mark avatar for removal locally
  const handleRemove = () => {
    setRemoveAvatar(true);
    setAvatarUrl(null);
    setFileInput(null);
  };

  // Submit updates (including file upload and/or removal)
  const handleSubmit = async e => {
    e.preventDefault();

    // If they clicked Remove, fire that endpoint first
    if (removeAvatar) {
      const rem = await fetch(
        `${API_BASE}/backend/index.php?action=remove_profile_pic`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const info = await rem.json();
      setMessage(info.message);
      setRemoveAvatar(false);
    }

    // Then send any new uploads + text fields
    const fd = new FormData();
    fd.append("username", form.username);
    fd.append("email", form.email);
    fd.append("bio", form.bio);
    if (fileInput) {
      fd.append("profile_pic", fileInput);
    }

    const res = await fetch(
      `${API_BASE}/backend/index.php?action=update_profile`,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      }
    );
    const data = await res.json();
    setMessage(data.message);
    if (res.ok) {
      // reload to pick up new picture from server
      setTimeout(() => window.location.reload(), 800);
    }
  };

  return (
    <div className="profile-page">
      <div className="profile-card glass-panel">
        <h2 className="profile-title">Edit Profile</h2>

        {message && <div className="alert alert-warning">{message}</div>}

        <div className="avatar-wrapper">
          {avatarUrl ? (
            <img src={avatarUrl} alt="Avatar" className="avatar-img" />
          ) : (
            <div className="avatar-placeholder">?</div>
          )}
        </div>

        {/* only show “Remove” if there's an existing avatar to clear */}
        {avatarUrl && (
          <button
            type="button"
            className="btn btn-outline-light btn-sm mb-3"
            onClick={handleRemove}
          >
            {removeAvatar
              ? "Profile Picture Will Be Removed"
              : "Remove Profile Picture"}
          </button>
        )}

        <form onSubmit={handleSubmit} className="profile-form">
          <label>Username</label>
          <input
            name="username"
            type="text"
            value={form.username}
            onChange={handleChange}
            required
          />

          <label>Email</label>
          <input
            name="email"
            type="email"
            value={form.email}
            onChange={handleChange}
            required
          />

          <label>Bio</label>
          <textarea
            name="bio"
            rows="3"
            value={form.bio}
            onChange={handleChange}
          />

          <label>Change Profile Picture</label>
          <input type="file" accept="image/*" onChange={handleFile} />

          <div className="form-buttons">
            <button type="submit" className="btn btn-gradient">
              Save Changes
            </button>
            <button
              type="button"
              className="btn btn-outline-danger"
              onClick={() => {
                logout();
                navigate("/auth");
              }}
            >
              Logout
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
