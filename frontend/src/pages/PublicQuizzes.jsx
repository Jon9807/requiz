// PublicQuizzes.jsx
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";

const PublicQuizzes = () => {
  const [quizzes, setQuizzes] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [message, setMessage] = useState("");

  const fetchQuizzes = (query = "") => {
    let url = "";
    if (query) {
      url = `http://localhost/re-quiz-app/backend/index.php?action=search_public_quizzes&q=${encodeURIComponent(
        query
      )}`;
    } else {
      url = `http://localhost/re-quiz-app/backend/index.php?action=public_quizzes`;
    }
    fetch(url)
      .then((res) => res.json())
      .then((data) => {
        if (data.quizzes) {
          setQuizzes(data.quizzes);
          setMessage("");
        } else {
          setMessage(data.message || "No quizzes found.");
        }
      })
      .catch((err) => setMessage("Error: " + err.message));
  };

  useEffect(() => {
    fetchQuizzes();
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchQuizzes(searchTerm);
  };

  return (
    <div className="container mt-5 text-light text-center">
      <h2 className="mb-4">Public Quizzes</h2>
      <form onSubmit={handleSearch}>
        <div className="d-flex justify-content-center mb-4">
          <div style={{ width: "100%", maxWidth: "500px" }}>
            <div className="input-group input-group-sm">
              <input
                type="text"
                placeholder="Search quizzes"
                className="form-control form-control-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </div>
      </form>

      {message && <p className="text-warning">{message}</p>}
      <div className="row">
        {quizzes.map((quiz) => (
          <div key={quiz.id} className="col-md-4 mb-4">
            <div className="card bg-dark text-light h-100">
              <div className="card-body">
                <h5 className="card-title">{quiz.name}</h5>
                <p className="card-text">{quiz.description}</p>
                <p className="card-text">
                  <small>By: {quiz.creator}</small>
                </p>

                <Link
                  to={`/play-user-quiz/${quiz.id}`}
                  state={{ from: "/public-quizzes" }}
                  className="btn btn-outline-info btn-sm"
                >
                  Play
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PublicQuizzes;
