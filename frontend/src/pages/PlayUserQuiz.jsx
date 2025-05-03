// src/pages/PlayUserQuiz.jsx
import React, { useState, useEffect, useContext, useRef } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { API_BASE } from "../config";


const PlayUserQuiz = () => {
  const { quizId }       = useParams();
  const navigate         = useNavigate();
  const location         = useLocation();
  const returnTo         = location.state?.from || "/public-quizzes";
  const { user, token }  = useContext(AuthContext);
  const startTimeRef     = useRef(Date.now());

  const [questions, setQuestions]       = useState(null);
  const [categoryId, setCategoryId]     = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null);
  const [feedback, setFeedback]         = useState("");
  const [score, setScore]               = useState(0);
  const [quizFinished, setQuizFinished] = useState(false);

  // Fetch questions + category
  useEffect(() => {
    const url = `${API_BASE}?action=get_quiz_questions&quiz_id=${quizId}`;
    const headers = { "Content-Type": "application/json" };
    if (token) headers.Authorization = `Bearer ${token}`;

    fetch(url, { headers })
      .then(r => r.json())
      .then(data => {
        setQuestions(data.questions || []);
        if (data.category_id) setCategoryId(data.category_id);
      })
      .catch(() => setQuestions([]));
  }, [quizId, token]);

  // Save session when finished
  useEffect(() => {
    if (!quizFinished || !token) return;
    const duration_seconds = Math.floor((Date.now() - startTimeRef.current) / 1000);
    const payload = {
      user_id:            user.id,
      quiz_id:            quizId,
      category_id:        categoryId,
      score,
      questions_answered: questions.length,
      duration_seconds,
    };
    fetch(`${API_BASE}?action=save_session`, {
      method:  "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization:   `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    }).then(res => {
      if (!res.ok) console.warn("Failed to save session", res.status);
    });
  }, [quizFinished, score, questions, token, user, categoryId, quizId]);

  // Loading / empty / done states
  if (questions === null) {
    return <p className="text-center text-light mt-5">Loading quiz…</p>;
  }
  if (questions.length === 0) {
    return (
      <div className="d-flex justify-content-center mt-5 px-3">
        <div className="card bg-dark text-light p-4" style={{ maxWidth: 600, width: "100%" }}>
          <h5 className="text-center">This quiz is empty</h5>
          <div className="d-flex justify-content-center mt-3">
            <button className="btn btn-outline-primary" onClick={() => navigate(returnTo)}>
              ← Back
            </button>
          </div>
        </div>
      </div>
    );
  }
  if (quizFinished) {
    return (
      <div className="d-flex justify-content-center mt-5 px-3">
        <div className="card bg-dark text-light p-4" style={{ maxWidth: 600, width: "100%" }}>
          <h5 className="text-center mb-3">Quiz Completed!</h5>
          <p className="text-center mb-4">Your score: {score} / {questions.length}</p>
          <div className="d-flex justify-content-center">
            <button className="btn btn-outline-primary" onClick={() => navigate(returnTo)}>
              ← Back to Quiz List
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Main quiz UI (identical style to QuizPlay.jsx)
  const q = questions[currentIndex];
  const handleOption = (opt) => {
    if (selectedOption) return;
    setSelectedOption(opt);
    if (opt === q.correct_option) {
      setFeedback("✅ Correct!");
      setScore(s => s + 1);
    } else {
      setFeedback(`❌ Wrong. Correct was ${q.correct_option}.`);
    }
  };
  const handleNext = () => {
    setSelectedOption(null);
    setFeedback("");
    if (currentIndex + 1 < questions.length) {
      setCurrentIndex(i => i + 1);
    } else {
      setQuizFinished(true);
    }
  };

  return (
    <div className="d-flex justify-content-center mt-5 px-3">
      <div className="card bg-dark text-light p-4" style={{ maxWidth: 600, width: "100%" }}>
        <h5 className="text-center mb-4">
          Question {currentIndex + 1} of {questions.length}
        </h5>
        <p className="mb-4 text-center">{q.question}</p>

        {["A","B","C","D"].map(letter => {
          const opt = q[`option_${letter.toLowerCase()}`];
          const isSel = selectedOption === letter;
          const isCorr = letter === q.correct_option;
          let btnClass = "btn-outline-primary";
          if (selectedOption) {
            if (isCorr)      btnClass = "btn-success";
            else if (isSel)  btnClass = "btn-danger";
            else             btnClass = "btn-secondary";
          }
          return (
            <button
              key={letter}
              onClick={() => handleOption(letter)}
              className={`btn d-block w-100 mb-2 text-center ${btnClass}`}
              disabled={!!selectedOption}
            >
              <strong>{letter}:</strong> {opt}
            </button>
          );
        })}

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

export default PlayUserQuiz;
