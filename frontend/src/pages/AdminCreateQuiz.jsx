// src/pages/AdminCreateQuiz.jsx
import React, { useEffect, useState } from "react";
import { API_BASE } from "../config"; 

const AdminCreateQuiz = () => {
  const [quizData, setQuizData] = useState({
    name: "",
    description: "",
    is_public: 1,
    category_id: "",
    subcategory_id: "",
  });

  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [message, setMessage] = useState("");

  // Fetch categories on load
  useEffect(() => {
    fetch(`${API_BASE}?action=get_categories`, {
      headers: { "Content-Type": "application/json" },
    })
      .then((res) => res.json())
      .then((data) => {
        const defaultCat = data.categories?.[0]?.id || "";
        setCategories(data.categories || []);
        setQuizData((d) => ({ ...d, category_id: defaultCat }));
      })
      .catch(() => setMessage("Failed to load categories"));
  }, []);

  // Fetch subcategories when category changes
  useEffect(() => {
    if (!quizData.category_id) return;
    fetch(`${API_BASE}?action=get_subcategories&category_id=${quizData.category_id}`)
      .then((res) => res.json())
      .then((data) => setSubcategories(data.subcategories || []));
  }, [quizData.category_id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setQuizData((d) => ({ ...d, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const token = localStorage.getItem("token");
    const payload = {
      ...quizData,
      category_id: parseInt(quizData.category_id),
      subcategory_id: quizData.subcategory_id
        ? parseInt(quizData.subcategory_id)
        : null,
      is_public: parseInt(quizData.is_public),
    };

    fetch(`${API_BASE}?action=admin_create_quiz`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    })
      .then((res) => res.json())
      .then((data) => setMessage(data.message))
      .catch((err) => setMessage("Error: " + err.message));
  };

  return (
    <div>
      <h3 className="text-light mb-4">Create Quiz (Admin)</h3>
      {message && <div className="alert alert-warning">{message}</div>}

      <form onSubmit={handleSubmit} className="row g-3">
        <div className="col-12">
          <label htmlFor="quizName" className="form-label text-light">
            Quiz Name
          </label>
          <input
            id="quizName"
            name="name"
            type="text"
            className="form-control form-control-sm"
            value={quizData.name}
            onChange={handleChange}
            required
          />
        </div>

        <div className="col-12">
          <label htmlFor="quizDescription" className="form-label text-light">
            Description
          </label>
          <textarea
            id="quizDescription"
            name="description"
            rows={2}
            className="form-control form-control-sm"
            value={quizData.description}
            onChange={handleChange}
          />
        </div>

        <div className="col-md-6">
          <label htmlFor="category_id" className="form-label text-light">
            Category
          </label>
          <select
            id="category_id"
            name="category_id"
            className="form-select form-select-sm"
            value={quizData.category_id}
            onChange={handleChange}
          >
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>

        <div className="col-md-6">
          <label htmlFor="subcategory_id" className="form-label text-light">
            Subcategory (optional)
          </label>
          <select
            id="subcategory_id"
            name="subcategory_id"
            className="form-select form-select-sm"
            value={quizData.subcategory_id}
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

        <div className="col-md-6">
          <label htmlFor="is_public" className="form-label text-light">
            Visibility
          </label>
          <select
            id="is_public"
            name="is_public"
            className="form-select form-select-sm"
            value={quizData.is_public}
            onChange={handleChange}
          >
            <option value={1}>Public</option>
            <option value={0}>Private</option>
          </select>
        </div>

        <div className="col-12 text-end">
          <button type="submit" className="btn btn-gradient btn-sm">
            Create Quiz
          </button>
        </div>
      </form>
    </div>
  );
};

export default AdminCreateQuiz;
