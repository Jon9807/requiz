// Home.jsx
import React, { useContext, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

const Home = () => {
  const { token, user } = useContext(AuthContext);
  const [featuredQuizzes, setFeaturedQuizzes] = useState([]);
  const [message, setMessage] = useState("");

  // Fetch some public quizzes
  useEffect(() => {
    fetch(
      "http://localhost/re-quiz-app/backend/index.php?action=public_quizzes",
      {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      }
    )
      .then((res) => res.json())
      .then((data) => {
        if (data.quizzes) {
          // Show only the first 6
          setFeaturedQuizzes(data.quizzes.slice(0, 6));
          setMessage("");
        } else {
          setMessage(data.message || "No quizzes available right now.");
        }
      })
      .catch((err) => setMessage("Error: " + err.message));
  }, []);

  return (
    <div className="container mt-5 text-light">
      <div className="p-5 mb-4 bg-dark rounded-3 text-center">
        <div className="container-fluid py-5">
          <h1 className="display-4">Welcome to ReQuiz!</h1>
          <p className="lead">
            Dive into dynamic trivia with quizzes created by experts and users
            alike.
          </p>
          {token ? (
            <p className="lead">
              Hello, {user && (user.display_name || user.username)}!
            </p>
          ) : (
            <Link to="/auth" className="btn btn-primary btn-lg">
              Sign Up / Login
            </Link>
          )}
        </div>
      </div>

      <h2 className="mb-4">Featured Quizzes</h2>
      {message && <p className="text-warning">{message}</p>}
      <div className="row">
        {featuredQuizzes.map((quiz) => (
          <div key={quiz.id} className="col-md-4 mb-4">
            <div className="card bg-dark text-light h-100">
              <div className="card-body d-flex flex-column">
                <h5 className="card-title">{quiz.name}</h5>
                <p className="card-text">{quiz.description}</p>
                <div className="mt-auto">
                  <Link
                    to={`/play-user-quiz/${quiz.id}`}
                    className="btn btn-outline-info"
                  >
                    Play
                  </Link>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
};

export default Home;
