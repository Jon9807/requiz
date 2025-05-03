// src/pages/EditQuiz.jsx

import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { API_BASE } from "../config"; // adjust path if needed

const ConfirmDialog = ({ show, title, message, onConfirm, onCancel }) => {
  if (!show) return null;
  return (
    <div
      className="d-flex justify-content-center align-items-center"
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        backgroundColor: "rgba(0,0,0,0.6)",
        zIndex: 1050,
      }}
    >
      <div
        className="bg-dark text-light p-4 rounded"
        style={{ maxWidth: "400px", width: "90%", boxShadow: "0 0 10px #f0f" }}
      >
        <h5>{title}</h5>
        {message && <p>{message}</p>}
        <div className="d-flex justify-content-end gap-2">
          <button className="btn btn-outline-danger btn-sm" onClick={onConfirm}>
            Yes
          </button>
          <button className="btn btn-outline-light btn-sm" onClick={onCancel}>
            No
          </button>
        </div>
      </div>
    </div>
  );
};

const EditQuiz = () => {
  const { quizId } = useParams();
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  const [quiz, setQuiz] = useState({
    name: "",
    description: "",
    is_public: false,
  });
  const [quizMessage, setQuizMessage] = useState("");
  const [questionMessage, setQuestionMessage] = useState("");
  const [quizQuestions, setQuizQuestions] = useState([]);
  const [newQuestionForm, setNewQuestionForm] = useState({
    question: "",
    option_a: "",
    option_b: "",
    option_c: "",
    option_d: "",
    correct_option: "",
  });
  const [editingQuestionId, setEditingQuestionId] = useState(null);
  const [editQuestionForm, setEditQuestionForm] = useState({
    question: "",
    option_a: "",
    option_b: "",
    option_c: "",
    option_d: "",
    correct_option: "",
  });
  const [confirmDeleteQuiz, setConfirmDeleteQuiz] = useState(false);
  const [confirmDeleteQuestionId, setConfirmDeleteQuestionId] = useState(null);

  // auto-clear quizMessage after 3s
  useEffect(() => {
    if (!quizMessage) return;
    const timer = setTimeout(() => setQuizMessage(""), 3000);
    return () => clearTimeout(timer);
  }, [quizMessage]);

  // auto-clear questionMessage after 3s
  useEffect(() => {
    if (!questionMessage) return;
    const timer = setTimeout(() => setQuestionMessage(""), 3000);
    return () => clearTimeout(timer);
  }, [questionMessage]);

  // Load quiz details
  useEffect(() => {
    if (!token) return navigate("/auth");
    fetch(`${API_BASE}?action=get_quiz_details&quiz_id=${quizId}`, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.message) {
          setQuizMessage(data.message);
        } else {
          setQuiz({
            name: data.name,
            description: data.description,
            is_public: data.is_public === 1,
          });
        }
      })
      .catch((err) => setQuizMessage("Error: " + err.message));
  }, [quizId, token, navigate]);

  // Load quiz questions
  useEffect(() => {
    fetch(`${API_BASE}?action=get_quiz_questions&quiz_id=${quizId}`, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.questions) {
          setQuizQuestions(data.questions);
        }
      })
      .catch((err) => console.error("Error fetching quiz questions:", err));
  }, [quizId, token]);

  // Handler for quiz form inputs
  const handleQuizChange = (e) => {
    const { name, value, type, checked } = e.target;
    setQuiz((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleQuizSubmit = (e) => {
    e.preventDefault();
    const payload = {
      quiz_id: quizId,
      name: quiz.name,
      description: quiz.description,
      is_public: quiz.is_public ? 1 : 0,
    };
    fetch(`${API_BASE}?action=edit_quiz`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    })
      .then((res) => res.json())
      .then((data) => {
        // catch both “fail to update quiz” and “failed to update quiz”
        let msg = data.message;
        if (/fail(ed)? to update quiz/i.test(msg)) {
          msg = "Up to date";
        }
        setQuizMessage(msg);
      })
      .catch((err) => setQuizMessage("Error: " + err.message));
  };
  

  const handleDeleteQuiz = () => setConfirmDeleteQuiz(true);
  const doDeleteQuiz = () => {
    setConfirmDeleteQuiz(false);
    fetch(`${API_BASE}?action=delete_quiz`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ quiz_id: quizId }),
    })
      .then((res) => res.json())
      .then((data) => {
        setQuizMessage(data.message);
        if (data.status === 200) navigate("/user-quizzes");
      })
      .catch((err) => setQuizMessage("Error: " + err.message));
  };

  // New question handlers
  const handleNewQuestionChange = (e) => {
    const { name, value } = e.target;
    setNewQuestionForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleNewQuestionSubmit = (e) => {
    e.preventDefault();
    const payload = { quiz_id: quizId, ...newQuestionForm };
    fetch(`${API_BASE}?action=create_quiz_question`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    })
      .then((res) => res.json())
      .then((data) => {
        setQuestionMessage(data.message);
        if (data.question_id) {
          setQuizQuestions((prev) => [
            ...prev,
            {
              id: data.question_id,
              ...newQuestionForm,
              correct_option: newQuestionForm.correct_option.toUpperCase(),
            },
          ]);
          setNewQuestionForm({
            question: "",
            option_a: "",
            option_b: "",
            option_c: "",
            option_d: "",
            correct_option: "",
          });
        }
      })
      .catch((err) => setQuestionMessage("Error: " + err.message));
  };

  // Delete question
  const handleDeleteQuestion = (id) => setConfirmDeleteQuestionId(id);
  const doDeleteQuestion = () => {
    const id = confirmDeleteQuestionId;
    setConfirmDeleteQuestionId(null);
    fetch(`${API_BASE}?action=delete_quiz_question`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ quiz_id: quizId, question_id: id }),
    })
      .then((res) => res.json())
      .then((data) => {
        setQuestionMessage(data.message);
        setQuizQuestions((prev) => prev.filter((q) => q.id !== id));
      })
      .catch((err) => setQuestionMessage("Error: " + err.message));
  };

  // Inline edit question
  const handleEditQuestion = (q) => {
    setEditingQuestionId(q.id);
    setEditQuestionForm({
      question: q.question,
      option_a: q.option_a,
      option_b: q.option_b,
      option_c: q.option_c,
      option_d: q.option_d,
      correct_option: q.correct_option,
    });
  };
  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditQuestionForm((prev) => ({ ...prev, [name]: value }));
  };
  const handleEditSave = (questionId) => {
    const payload = {
      quiz_id: quizId,
      question_id: questionId,
      ...editQuestionForm,
    };
    fetch(`${API_BASE}?action=update_quiz_question`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.status === 200) {
          setQuizQuestions((prev) =>
            prev.map((q) =>
              q.id === questionId
                ? {
                    ...q,
                    ...editQuestionForm,
                    correct_option:
                      editQuestionForm.correct_option.toUpperCase(),
                  }
                : q
            )
          );
          setEditingQuestionId(null);
        } else {
          setQuestionMessage(data.message);
        }
      })
      .catch((err) => setQuestionMessage("Error: " + err.message));
  };
  const handleEditCancel = () => setEditingQuestionId(null);

  return (
    <div className="container mt-5 d-flex justify-content-center">
      <div className="form-wrapper w-100" style={{ maxWidth: "600px" }}>
        <h2 className="mb-4">Edit Quiz</h2>

        {quizMessage && (
          <p className="text-success text-center">{quizMessage}</p>
        )}

        {/* Quiz Details */}
        <form onSubmit={handleQuizSubmit}>
          <div className="mb-3">
            <label htmlFor="quizName" className="form-label">
              Quiz Name
            </label>
            <input
              id="quizName"
              name="name"
              type="text"
              className="form-control form-control-sm"
              value={quiz.name}
              onChange={handleQuizChange}
              required
            />
          </div>
          <div className="mb-3">
            <label htmlFor="quizDescription" className="form-label">
              Description
            </label>
            <textarea
              id="quizDescription"
              name="description"
              rows={2}
              className="form-control form-control-sm"
              value={quiz.description}
              onChange={handleQuizChange}
            />
          </div>
          <div className="form-check mb-3">
            <input
              id="isPublic"
              name="is_public"
              type="checkbox"
              className="form-check-input"
              checked={quiz.is_public}
              onChange={handleQuizChange}
            />
            <label htmlFor="isPublic" className="form-check-label">
              Make Quiz Public
            </label>
          </div>
          <div className="d-flex gap-2 mb-4">
            <button type="submit" className="btn btn-outline-primary btn-sm">
              Update Quiz
            </button>
            <button
              type="button"
              className="btn btn-outline-danger btn-sm"
              onClick={handleDeleteQuiz}
            >
              Delete Quiz
            </button>
          </div>
        </form>

        <h3 className="mb-3">Add a New Question</h3>
        {questionMessage && (
          <p className="text-success text-center">{questionMessage}</p>
        )}
        <form onSubmit={handleNewQuestionSubmit}>
          <div className="mb-3">
            <label className="form-label">Question</label>
            <textarea
              name="question"
              rows={2}
              className="form-control form-control-sm mb-2"
              value={newQuestionForm.question}
              onChange={handleNewQuestionChange}
              required
            />
          </div>
          {["option_a", "option_b", "option_c", "option_d"].map((opt, i) => (
            <div className="mb-3" key={opt}>
              <label className="form-label">
                Option {String.fromCharCode(65 + i)}
              </label>
              <input
                name={opt}
                className="form-control form-control-sm"
                value={newQuestionForm[opt]}
                onChange={handleNewQuestionChange}
                required
              />
            </div>
          ))}
          <div className="mb-3">
            <label className="form-label">Correct Option</label>
            <input
              name="correct_option"
              className="form-control form-control-sm"
              value={newQuestionForm.correct_option}
              onChange={handleNewQuestionChange}
              required
            />
          </div>
          <div className="d-grid mb-4">
            <button className="btn btn-primary btn-sm">Add Question</button>
          </div>
        </form>

        <h3>Quiz Questions</h3>
        <ul className="list-group">
          {quizQuestions.map((q) => (
            <li
              key={q.id}
              className="list-group-item mb-3 question-card text-light"
            >
              {editingQuestionId === q.id ? (
                <>
                  {/* edit form */}
                  <div className="mb-2">
                    <label className="form-label">Question</label>
                    <textarea
                      name="question"
                      rows={2}
                      className="form-control form-control-sm mb-2"
                      value={editQuestionForm.question}
                      onChange={handleEditChange}
                    />
                  </div>
                  {["option_a", "option_b", "option_c", "option_d"].map(
                    (opt, i) => (
                      <div className="mb-2" key={opt}>
                        <label className="form-label">
                          Option {String.fromCharCode(65 + i)}
                        </label>
                        <input
                          name={opt}
                          className="form-control form-control-sm"
                          value={editQuestionForm[opt]}
                          onChange={handleEditChange}
                        />
                      </div>
                    )
                  )}
                  <div className="mb-3">
                    <label className="form-label">Correct Option</label>
                    <input
                      name="correct_option"
                      className="form-control form-control-sm"
                      value={editQuestionForm.correct_option}
                      onChange={handleEditChange}
                    />
                  </div>
                  <div className="d-flex gap-2">
                    <button
                      className="btn btn-sm btn-outline-success"
                      onClick={() => handleEditSave(q.id)}
                    >
                      Save
                    </button>
                    <button
                      className="btn btn-sm btn-outline-light"
                      onClick={handleEditCancel}
                    >
                      Cancel
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <p>
                    <strong>Question:</strong> {q.question}
                  </p>
                  {["A", "B", "C", "D"].map((l) => (
                    <p key={l}>
                      <strong>{l}:</strong> {q[`option_${l.toLowerCase()}`]}
                    </p>
                  ))}
                  <p>
                    <strong>Correct:</strong> {q.correct_option}
                  </p>
                  <div className="d-flex gap-2">
                    <button
                      className="btn btn-sm btn-outline-warning"
                      onClick={() => handleEditQuestion(q)}
                    >
                      Edit
                    </button>
                    <button
                      className="btn btn-sm btn-outline-danger"
                      onClick={() => handleDeleteQuestion(q.id)}
                    >
                      Delete
                    </button>
                  </div>
                </>
              )}
            </li>
          ))}
        </ul>
      </div>

      {/* Confirm Dialogs */}
      <ConfirmDialog
        show={confirmDeleteQuiz}
        title="Delete this quiz?"
        message="This cannot be undone."
        onConfirm={doDeleteQuiz}
        onCancel={() => setConfirmDeleteQuiz(false)}
      />
      <ConfirmDialog
        show={confirmDeleteQuestionId != null}
        title="Delete this question?"
        onConfirm={doDeleteQuestion}
        onCancel={() => setConfirmDeleteQuestionId(null)}
      />
    </div>
  );
};

export default EditQuiz;
