// src/pages/AdminPanel.jsx
import React from "react";
import { NavLink, Outlet } from "react-router-dom";

const AdminPanel = () => {
  return (
    <div className="container mt-5">
      <h2 className="text-light mb-4">Admin Panel</h2>
      <div className="row">
        <div className="col-md-3">
          <div className="list-group bg-dark rounded shadow-sm neon-border">
            <NavLink
              to="/admin"
              end
              className="list-group-item list-group-item-action bg-dark text-light neon-border-hover"
            >
              Dashboard
            </NavLink>
            <NavLink
              to="/admin/create-quiz"
              className="list-group-item list-group-item-action bg-dark text-light neon-border-hover"
            >
              Create Quiz
            </NavLink>
            <NavLink
              to="/admin/questions"
              className="list-group-item list-group-item-action bg-dark text-light neon-border-hover"
            >
              Manage Questions
            </NavLink>
            <NavLink
              to="/admin/quizzes"
              className="list-group-item list-group-item-action bg-dark text-light neon-border-hover"
            >
              Manage Quizzes
            </NavLink>
            <NavLink
              to="/admin/users"
              className="list-group-item list-group-item-action bg-dark text-light neon-border-hover"
            >
              Manage Users
            </NavLink>
          </div>
        </div>
        <div className="col-md-9">
          <div className="card bg-dark text-light shadow-sm neon-border p-4">
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;
