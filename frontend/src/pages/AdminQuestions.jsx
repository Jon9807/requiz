// src/pages/AdminQuestions.jsx
import React, { useState, useEffect } from 'react';

const AdminQuestions = () => {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [delQuestion, setDelQuestion] = useState(null);
  const [editQuestion, setEditQuestion] = useState(null);
  const [editForm, setEditForm] = useState({
    question: '',
    option_a: '',
    option_b: '',
    option_c: '',
    option_d: '',
    correct_option: '',
  });

  const token = localStorage.getItem('token');

  // Load all questions
  const loadQuestions = async () => {
    setLoading(true);
    try {
      const res = await fetch(
        'http://localhost/re-quiz-app/backend/index.php?action=get_all_questions',
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const data = await res.json();
      setQuestions(data.questions || []);
    } catch {
      setMessage({ text: 'Failed to load questions', type: 'danger' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadQuestions();
  }, [token]);

  // Delete a question
  const handleDelete = async () => {
    try {
      const res = await fetch(
        'http://localhost/re-quiz-app/backend/index.php?action=delete_question',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ question_id: delQuestion.id }),
        }
      );
      const data = await res.json();
      if (res.ok) {
        setQuestions((q) => q.filter((x) => x.id !== delQuestion.id));
        setMessage({ text: 'Question deleted', type: 'success' });
      } else {
        setMessage({ text: data.message || 'Delete failed', type: 'danger' });
      }
    } catch {
      setMessage({ text: 'Delete error', type: 'danger' });
    } finally {
      setDelQuestion(null);
      setTimeout(() => setMessage({ text: '', type: '' }), 3000);
    }
  };

  // Open edit modal
  const openEdit = (q) => {
    setEditQuestion(q);
    setEditForm({
      question: q.question,
      option_a: q.option_a,
      option_b: q.option_b,
      option_c: q.option_c,
      option_d: q.option_d,
      correct_option: q.correct_option,
    });
  };

  // Save edits
  const handleSave = async () => {
    try {
      const res = await fetch(
        'http://localhost/re-quiz-app/backend/index.php?action=update_question',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            question_id: editQuestion.id,
            question: editForm.question,
            option_a: editForm.option_a,
            option_b: editForm.option_b,
            option_c: editForm.option_c,
            option_d: editForm.option_d,
            correct_option: editForm.correct_option.toUpperCase(),
          }),
        }
      );
      const data = await res.json();
      if (res.ok) {
        setQuestions((qs) =>
          qs.map((q) =>
            q.id === editQuestion.id
              ? { ...q, ...editForm, correct_option: editForm.correct_option.toUpperCase() }
              : q
          )
        );
        setMessage({ text: 'Question updated', type: 'success' });
      } else {
        setMessage({ text: data.message || 'Update failed', type: 'danger' });
      }
    } catch {
      setMessage({ text: 'Update error', type: 'danger' });
    } finally {
      setEditQuestion(null);
      setTimeout(() => setMessage({ text: '', type: '' }), 3000);
    }
  };

  return (
    <>
      <h3 className="text-light mb-3">Manage Questions</h3>
      {message.text && (
        <div className={`alert alert-${message.type} alert-sm text-center`}>
          {message.text}
        </div>
      )}

      <div className="card bg-dark border-0 neon-glow p-4">
        {loading ? (
          <p className="text-light">Loading…</p>
        ) : questions.length === 0 ? (
          <p className="text-light">No questions found.</p>
        ) : (
          <table className="table table-dark table-striped align-middle">
            <thead>
              <tr>
                <th>ID</th>
                <th>Question</th>
                <th>Category</th>
                <th>Difficulty</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {questions.map((q) => (
                <tr key={q.id}>
                  <td>{q.id}</td>
                  <td>{q.question}</td>
                  <td>{q.category_name}</td>
                  <td>{q.difficulty}</td>
                  <td className="d-flex gap-2">
                    <button
                      className="btn btn-sm btn-outline-warning"
                      onClick={() => openEdit(q)}
                    >
                      Edit
                    </button>
                    <button
                      className="btn btn-sm btn-outline-danger"
                      onClick={() => setDelQuestion(q)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Delete Modal */}
      {delQuestion && (
        <div className="modal fade show" style={{ display: 'block' }}>
          <div className="modal-backdrop fade show"></div>
          <div className="modal-dialog modal-dialog-centered" style={{ zIndex: 2000 }}>
            <div className="modal-content bg-dark text-light neon-glow border-0">
              <div className="modal-header">
                <h5 className="modal-title">Delete Question?</h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => setDelQuestion(null)}
                />
              </div>
              <div className="modal-body">
                Are you sure you want to delete:
                <br />
                <strong>{delQuestion.question}</strong>?
              </div>
              <div className="modal-footer">
                <button
                  className="btn btn-sm btn-outline-light"
                  onClick={() => setDelQuestion(null)}
                >
                  Cancel
                </button>
                <button className="btn btn-sm btn-danger" onClick={handleDelete}>
                  Yes, Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editQuestion && (
        <div className="modal fade show" style={{ display: 'block' }}>
          <div className="modal-backdrop fade show"></div>
          <div className="modal-dialog modal-dialog-centered" style={{ zIndex: 2000 }}>
            <div className="modal-content bg-dark text-light neon-glow border-0">
              <div className="modal-header">
                <h5 className="modal-title">Edit Question</h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => setEditQuestion(null)}
                />
              </div>
              <div className="modal-body">
                <div className="mb-2">
                  <label className="form-label">Question</label>
                  <textarea
                    rows={2}
                    className="form-control form-control-sm"
                    value={editForm.question}
                    onChange={(e) => setEditForm((f) => ({ ...f, question: e.target.value }))}
                  />
                </div>
                {['option_a', 'option_b', 'option_c', 'option_d'].map((opt, i) => (
                  <div className="mb-2" key={opt}>
                    <label className="form-label">Option {String.fromCharCode(65 + i)}</label>
                    <input
                      className="form-control form-control-sm"
                      value={editForm[opt]}
                      onChange={(e) => setEditForm((f) => ({ ...f, [opt]: e.target.value }))}
                    />
                  </div>
                ))}
                <div className="mb-3">
                  <label className="form-label">Correct Option (A–D)</label>
                  <input
                    className="form-control form-control-sm"
                    value={editForm.correct_option}
                    onChange={(e) => setEditForm((f) => ({ ...f, correct_option: e.target.value.toUpperCase() }))}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button
                  className="btn btn-sm btn-outline-light"
                  onClick={() => setEditQuestion(null)}
                >
                  Cancel
                </button>
                <button className="btn btn-sm btn-success" onClick={handleSave}>
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AdminQuestions;
