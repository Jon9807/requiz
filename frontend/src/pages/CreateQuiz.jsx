//CreateQuiz.jsx

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const CreateQuiz = () => {
  const [quizName, setQuizName] = useState("");
  const [description, setDescription] = useState("");
  const [isPublic, setIsPublic] = useState(false);
  const [message, setMessage] = useState("");
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedSubcategory, setSelectedSubcategory] = useState("");

  const navigate = useNavigate();

  useEffect(() => {
    fetch("http://localhost/re-quiz-app/backend/index.php?action=get_categories")
      .then((res) => res.json())
      .then((data) => setCategories(data.categories));
  }, []);

  useEffect(() => {
    if (!selectedCategory) return;
    fetch(`http://localhost/re-quiz-app/backend/index.php?action=get_subcategories&category_id=${selectedCategory}`)
      .then((res) => res.json())
      .then((data) => setSubcategories(data.subcategories));
  }, [selectedCategory]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("token");
    try {
      const response = await fetch(
        "http://localhost/re-quiz-app/backend/index.php?action=create_quiz",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            name: quizName,
            description,
            is_public: isPublic ? 1 : 0,
            category_id: parseInt(selectedCategory),
            subcategory_id: selectedSubcategory ? parseInt(selectedSubcategory) : null,
          }),
        }
      );
      const data = await response.json();
      setMessage(data.message);
      if (response.ok && data.quiz_id) {
        setQuizName("");
        setDescription("");
        setIsPublic(false);
        navigate(`/create-quiz-questions/${data.quiz_id}`);
      }
    } catch (err) {
      setMessage("Error: " + err.message);
    }
  };

  return (
    <div className="container mt-5 d-flex justify-content-center">
      <div className="form-wrapper w-100" style={{ maxWidth: "600px" }}>
        <h2 className="text-center mb-4">Create a New Quiz</h2>
        {message && <p className="text-warning text-center">{message}</p>}
        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="form-label">Category</label>
            <select
              className="form-control form-control-sm"
              value={selectedCategory}
              onChange={(e) => {
                setSelectedCategory(e.target.value);
                setSelectedSubcategory("");
              }}
              required
            >
              <option value="">Select category</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          {selectedCategory && (
            <div className="mb-3">
              <label className="form-label">Default Subcategory (optional)</label>
              <select
                className="form-control form-control-sm"
                value={selectedSubcategory}
                onChange={(e) => setSelectedSubcategory(e.target.value)}
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
            <label htmlFor="quizName" className="form-label">Quiz Name</label>
            <input
              type="text"
              id="quizName"
              className="form-control form-control-sm"
              value={quizName}
              onChange={(e) => setQuizName(e.target.value)}
              required
            />
          </div>

          <div className="mb-3">
            <label htmlFor="quizDescription" className="form-label">Description</label>
            <textarea
              id="quizDescription"
              className="form-control form-control-sm"
              rows="3"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="form-check mb-3">
            <input
              type="checkbox"
              id="isPublic"
              className="form-check-input"
              checked={isPublic}
              onChange={(e) => setIsPublic(e.target.checked)}
            />
            <label htmlFor="isPublic" className="form-check-label">
              Make Quiz Public
            </label>
          </div>

          <div className="d-grid">
            <button type="submit" className="btn btn-outline-primary btn-sm">
              Create Quiz
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateQuiz;
