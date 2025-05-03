// src/pages/QuizGenerator.jsx

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { API_BASE } from "../config"; // ✅ using global config

export default function QuizGenerator() {
  const [categories, setCategories] = useState([]);
  const [category, setCategory]   = useState("");
  const [difficulty, setDifficulty] = useState("Medium");
  const [num, setNum]             = useState(10);
  const [error, setError]         = useState("");
  const [loading, setLoading]     = useState(false);
  const navigate                  = useNavigate();

  // Load categories once on mount
  useEffect(() => {
    fetch(`${API_BASE}?action=get_categories`)
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then(data => {
        if (Array.isArray(data.categories) && data.categories.length) {
          setCategories(data.categories);
          // default to the first one
          setCategory(data.categories[0].name);
        } else {
          setError("No categories found");
        }
      })
      .catch(() => {
        setError("Failed to load categories – check your API_BASE URL");
      });
  }, []);

  // Trigger quiz generation
  const generateQuiz = async () => {
    // clamp to 1–15
    if (num < 1 || num > 15) {
      setError("Please choose between 1 and 15 questions.");
      return;
    }
    setError("");
    setLoading(true);

    try {
      const res = await fetch(
        `${API_BASE}?action=generate_quiz&category=${encodeURIComponent(
          category
        )}&difficulty=${encodeURIComponent(difficulty)}&num=${num}`
      );
      const data = await res.json();
      if (data.status === 200 && Array.isArray(data.quiz)) {
        // push into the play screen
        navigate("/play-quiz", {
          state: { quizData: data.quiz, from: "/generate-quiz" },
        });
      } else {
        setError(data.error || "Error generating quiz");
      }
    } catch (e) {
      setError("Error: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mt-5 d-flex justify-content-center">
      <div className="generate-wrapper w-100" style={{ maxWidth: 600 }}>
        <h2 className="text-center mb-4">Generate Your Quiz</h2>

        {error && <div className="alert alert-danger alert-sm">{error}</div>}

        <div className="row g-3">
          <div className="col-md-6">
            <label htmlFor="category" className="form-label">
              Category:
            </label>
            <select
              id="category"
              className="form-select form-select-sm"
              disabled={loading || !categories.length}
              value={category}
              onChange={e => setCategory(e.target.value)}
            >
              {categories.map(cat => (
                <option key={cat.id} value={cat.name}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          <div className="col-md-6">
            <label htmlFor="difficulty" className="form-label">
              Difficulty:
            </label>
            <select
              id="difficulty"
              className="form-select form-select-sm"
              disabled={loading}
              value={difficulty}
              onChange={e => setDifficulty(e.target.value)}
            >
              <option>Easy</option>
              <option>Medium</option>
              <option>Hard</option>
            </select>
          </div>

          <div className="col-12">
            <label htmlFor="numQuestions" className="form-label">
              Number of Questions (1–15):
            </label>
            <input
              type="number"
              id="numQuestions"
              className="form-control"
              disabled={loading}
              min={1}
              max={15}
              value={num}
              onChange={e =>
                setNum(Math.max(1, Math.min(15, Number(e.target.value))))
              }
            />
          </div>
        </div>

        <div className="d-grid mt-3">
          <button
            onClick={generateQuiz}
            className="btn btn-primary btn-sm"
            disabled={loading}
          >
            {loading && (
              <span
                className="spinner-border spinner-border-sm me-2"
                role="status"
                aria-hidden="true"
              />
            )}
            {loading ? "Generating..." : "Generate Quiz"}
          </button>
        </div>
      </div>
    </div>
  );
}
