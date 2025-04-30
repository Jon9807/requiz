// AdminDashboard.jsx
import React, { useEffect, useState } from "react";
import { API_BASE } from "../config";

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    userCount: 0,
    quizCount: 0,
    questionCount: 0,
  });
  const [message, setMessage] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("token");
    fetch(`${API_BASE}?action=get_admin_stats`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.stats) {
          setStats(data.stats);
        } else {
          setMessage(data.message || "No stats available.");
        }
      })
      .catch((err) => setMessage("Error: " + err.message));
  }, []);

  return (
    <div>
      <h3 className="text-light">Dashboard</h3>
      {message && <p className="text-warning">{message}</p>}
      <div className="row">
        <div className="col-md-4">
          <div className="card text-white bg-primary mb-3">
            <div className="card-body">
              <h5 className="card-title">Users</h5>
              <p className="card-text">{stats.userCount}</p>
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card text-white bg-success mb-3">
            <div className="card-body">
              <h5 className="card-title">Quizzes</h5>
              <p className="card-text">{stats.quizCount}</p>
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card text-white bg-warning mb-3">
            <div className="card-body">
              <h5 className="card-title">Questions</h5>
              <p className="card-text">{stats.questionCount}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
