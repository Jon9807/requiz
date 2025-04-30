//CreateQuizQuestions.jsx
import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";

const CreateQuizQuestions = () => {
  const { quizId } = useParams();

  const [form, setForm] = useState({
    question: "",
    option_a: "",
    option_b: "",
    option_c: "",
    option_d: "",
    correct_option: "",
    subcategory_id: "",
  });
  const [quizInfo, setQuizInfo] = useState(null);
  const [subcategories, setSubcategories] = useState([]);
  const [message, setMessage] = useState("");

  // Fetch quiz details on mount
  useEffect(() => {
    const token = localStorage.getItem("token");
    fetch(
      `http://localhost/re-quiz-app/backend/index.php?action=get_quiz_details&quiz_id=${quizId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    )
      .then((res) => res.json())
      .then((data) => {
        if (data && data.name) {
          setQuizInfo(data);
          //fetch subcategories if needed
          fetch(
            `http://localhost/re-quiz-app/backend/index.php?action=get_subcategories&category_id=${data.category_id}`
          )
            .then((r) => r.json())
            .then((result) => setSubcategories(result.subcategories || []));
        }
      });
  }, [quizId]);

  //clear the message whenever any field changes
  const handleChange = (e) => {
    if (message) setMessage("");
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(
        "http://localhost/re-quiz-app/backend/index.php?action=create_quiz_question",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            quiz_id: quizId,
            ...form,
            subcategory_id:
              quizInfo?.subcategory_id || form.subcategory_id || null,
          }),
        }
      );
      const text = await res.text();
      const data = JSON.parse(text);
      setMessage(data.message);
      if (data.question_id) {
        setForm({
          question: "",
          option_a: "",
          option_b: "",
          option_c: "",
          option_d: "",
          correct_option: "",
          subcategory_id: "",
        });
      }
    } catch (err) {
      setMessage("Error: " + err.message);
    }
  };

  return (
    <div className="container mt-5 d-flex justify-content-center">
      <div className="form-wrapper w-100" style={{ maxWidth: "600px" }}>
        {quizInfo && (
          <>
            <div className="mb-3 text-center">
              <h2>{quizInfo.name}</h2>
            </div>
            {message && <p className="text-warning text-center">{message}</p>}

            <form onSubmit={handleSubmit}>
              {quizInfo.subcategory_id ? (
                <div className="mb-3 text-center text-secondary">
                  Subcategory locked: <strong><div id={quizInfo.subcategory_name}></div></strong>
                </div>
              ) : (
                <div className="mb-3">
                  <label className="form-label">Subcategory (optional)</label>
                  <select
                    className="form-control form-control-sm"
                    name="subcategory_id"
                    value={form.subcategory_id}
                    onChange={handleChange}
                  >
                    <option value="">None</option>
                    {subcategories.map((sub) => (
                      <option key={sub.id} value={sub.id}>
                        {sub.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="mb-3">
                <label htmlFor="question" className="form-label">
                  Question
                </label>
                <textarea
                  id="question"
                  name="question"
                  className="form-control form-control-sm"
                  rows={2}
                  value={form.question}
                  onChange={handleChange}
                  required
                />
              </div>

              {["option_a", "option_b", "option_c", "option_d"].map((opt, i) => (
                <div className="mb-3" key={opt}>
                  <label htmlFor={opt} className="form-label">
                    Option {String.fromCharCode(65 + i)}
                  </label>
                  <input
                    id={opt}
                    name={opt}
                    type="text"
                    className="form-control form-control-sm"
                    value={form[opt]}
                    onChange={handleChange}
                    required
                  />
                </div>
              ))}

              <div className="mb-3">
                <label htmlFor="correct_option" className="form-label">
                  Correct Option (A, B, C, or D)
                </label>
                <input
                  id="correct_option"
                  name="correct_option"
                  type="text"
                  className="form-control form-control-sm"
                  value={form.correct_option}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="d-grid">
                <button type="submit" className="btn btn-primary btn-sm">
                  Add Question
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
};

export default CreateQuizQuestions;
