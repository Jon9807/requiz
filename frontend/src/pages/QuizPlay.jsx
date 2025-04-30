// src/pages/QuizPlay.jsx

import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";

const QuizPlay = () => {
  const { state } = useLocation();
  const navigate = useNavigate();
  const rawQuizData = state?.quizData || null;
  const backTo = state?.from || "/";

  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null);
  const [feedback, setFeedback] = useState("");
  const [score, setScore] = useState(0);
  const [quizFinished, setQuizFinished] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!rawQuizData) {
      setError("No quiz data provided.");
      return;
    }
    let data = rawQuizData;
    if (typeof data === "string") {
      let text = data.trim();
      if (text.startsWith("```")) {
        text = text.replace(/^```.*\n?/, "").replace(/```$/, "").trim();
      }
      try {
        data = JSON.parse(text);
      } catch {
        setError("Failed to parse quiz JSON.");
        return;
      }
    }
    if (Array.isArray(data)) {
      setQuestions(data);
    } else {
      setError("Invalid quiz data format.");
    }
  }, [rawQuizData]);

  const handleOptionClick = (opt) => {
    if (selectedOption) return;
    setSelectedOption(opt);
    const correct = questions[currentIndex].answer;
    if (opt === correct) {
      setScore((s) => s + 1);
      setFeedback("✅ Correct!");
    } else {
      setFeedback(`❌ The correct answer was ${correct}.`);
    }
  };

  const handleNext = () => {
    setSelectedOption(null);
    setFeedback("");
    if (currentIndex + 1 < questions.length) {
      setCurrentIndex((i) => i + 1);
    } else {
      setQuizFinished(true);
    }
  };

  if (error) {
    return (
      <div className="container mt-5 text-center text-danger">{error}</div>
    );
  }
  if (!questions.length) {
    return <p className="text-center text-light mt-5">Loading quiz…</p>;
  }
  if (quizFinished) {
    return (
      <div className="d-flex justify-content-center mt-5 px-3">
        <div
          className="card bg-dark text-light p-4"
          style={{ maxWidth: 600, width: "100%" }}
        >
          <h3 className="text-center mb-3">Quiz Complete!</h3>
          <p className="text-center mb-4">
            Your score: {score} / {questions.length}
          </p>
          <div className="d-flex justify-content-center">
            <button
              className="btn btn-secondary"
              onClick={() => navigate(backTo)}
            >
              ← Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  const q = questions[currentIndex];

  return (
    <div className="d-flex justify-content-center mt-5 px-3">
      <div
        className="card bg-dark text-light p-4"
        style={{ maxWidth: 600, width: "100%" }}
      >
        <h5 className="text-center mb-4">
          Question {currentIndex + 1} of {questions.length}
        </h5>
        <p className="mb-4 text-center">{q.question}</p>

        {q.options.map((opt, idx) => (
          <button
            key={idx}
            onClick={() => handleOptionClick(opt)}
            className={`btn d-block w-100 mb-2 text-center ${
              selectedOption
                ? opt === q.answer
                  ? "btn-success"
                  : opt === selectedOption
                  ? "btn-danger"
                  : "btn-secondary"
                : "btn-outline-primary"
            }`}
            disabled={!!selectedOption}
          >
            <strong>{String.fromCharCode(65 + idx)}:</strong> {opt}
          </button>
        ))}

        {feedback && <div className="mt-3 text-center">{feedback}</div>}

        {selectedOption && (
          <div className="d-flex justify-content-center mt-4">
            <button className="btn btn-primary" onClick={handleNext}>
              {currentIndex + 1 === questions.length ? "Finish" : "Next"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default QuizPlay;
