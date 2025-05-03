import React, { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { API_BASE } from "../config";
import "../styles/Profile.css";

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

    fetch(`${API_BASE}?action=get_profile`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.username) {
          setForm({
            username: data.username,
            email: data.email,
            bio: data.bio || "",
          });

          if (data.profile_pic) {
            const base = API_BASE.split("/index.php")[0];
            setAvatarUrl(`${base}/${data.profile_pic}`);
          }
        } else {
          setMessage(data.message || "Failed to load profile");
        }
      })
      .catch(() => setMessage("Failed to load profile"));
  }, [token, navigate]);

  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  // Handle new file selection and preview
  const handleFile = (e) => {
    const file = e.target.files[0];
    setFileInput(file);
    setRemoveAvatar(false);

    if (file) {
      const reader = new FileReader();
      reader.onload = () => setAvatarUrl(reader.result);
      reader.readAsDataURL(file);
    }
  };

  // Remove avatar locally
  const handleRemove = () => {
    setRemoveAvatar(true);
    setAvatarUrl(null);
    setFileInput(null);
  };

  // Submit updates
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (removeAvatar) {
      await fetch(`${API_BASE}?action=remove_profile_pic`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => res.json())
        .then((data) => setMessage(data.message))
        .catch(() => setMessage("Failed to remove profile picture"));

      setRemoveAvatar(false);
    }

    const fd = new FormData();
    fd.append("username", form.username);
    fd.append("email", form.email);
    fd.append("bio", form.bio);
    if (fileInput) {
      fd.append("profile_pic", fileInput);
    }

    const res = await fetch(`${API_BASE}?action=update_profile`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: fd,
    });

    const data = await res.json();
    setMessage(data.message);

    if (res.ok) {
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
