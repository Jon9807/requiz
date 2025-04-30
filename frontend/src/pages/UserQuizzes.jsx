//UserQuizzes.jsx
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";

const UserQuizzes = () => {
  const [quizzes, setQuizzes] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      setQuizzes([]); // no token = no quizzes
      return;
    }

    fetch(
      "http://localhost/re-quiz-app/backend/index.php?action=get_user_quizzes",
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      }
    )
      .then((response) => {
        if (response.status === 401) {
          // backend uses 401 to signal “no quizzes”
          return { quizzes: [] };
        }
        if (!response.ok) {
          throw new Error(`Server error: ${response.status}`);
        }
        return response.json();
      })
      .then((data) => {
        setQuizzes(data.quizzes || []); // always set something
      })
      .catch((err) => {
        console.error("Fetch user quizzes failed:", err);
        setQuizzes([]); // fallback on any error
      });
  }, []);

  return (
    <div className="container mt-5">
      <h2 className="mb-4 text-center text-light">My Quizzes</h2>
      {error && <p className="text-danger">Error: {error}</p>}
      {quizzes.length === 0 ? (
        <p>You haven't created any quizzes yet.</p>
      ) : (
        <div className="row">
          {quizzes.map((quiz) => (
            <div key={quiz.id} className="col-md-6 col-lg-4 mb-4">
              <div className="card bg-dark text-light h-100">
                <div className="card-body d-flex flex-column">
                  <h5 className="card-title">{quiz.name}</h5>
                  <p className="card-text">
                    Status: {quiz.is_public ? "Public" : "Private"}
                  </p>
                  <div className="mt-auto">
                    <Link
                      to={`/edit-quiz/${quiz.id}`}
                      className="btn btn-outline-light btn-sm me-2"
                    >
                      Edit
                    </Link>
                    <Link
                      to={`/play-user-quiz/${quiz.id}`}
                      state={{ from: "/user-quizzes" }}
                      className="btn btn-outline-info btn-sm"
                    >
                      Play
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default UserQuizzes;
