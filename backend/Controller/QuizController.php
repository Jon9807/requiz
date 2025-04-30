<?php
//Backend/Controller/QuizController.php

namespace Controller;

use Model\Quiz;

class QuizController
{
    private $conn;
    private $secretKey;

    //constructor accepts the database connection and secret key.
    public function __construct($conn, $secretKey)
    {
        $this->conn = $conn;
        $this->secretKey = $secretKey;
    }

    //create a new quiz
    public function create($data, $userId)
    {
        $name = isset($data['name']) ? trim($data['name']) : '';
        $description = isset($data['description']) ? trim($data['description']) : '';
        $isPublic = isset($data['is_public']) ? intval($data['is_public']) : 0;
        $categoryId = isset($data['category_id']) ? intval($data['category_id']) : 0;
        $subcategoryId = isset($data['subcategory_id']) ? intval($data['subcategory_id']) : null;

        if (empty($name) || $categoryId === 0) {
            return ['status' => 400, 'message' => 'Quiz name and category are required'];
        }

        $stmt = $this->conn->prepare("INSERT INTO user_quizzes (user_id, category_id, subcategory_id, name, description, is_public, created_at) VALUES (?, ?, ?, ?, ?, ?, NOW())");
        $stmt->bind_param("iiissi", $userId, $categoryId, $subcategoryId, $name, $description, $isPublic);

        if ($stmt->execute()) {
            $quizId = $stmt->insert_id;
            $stmt->close();
            return ['status' => 201, 'message' => 'Quiz created successfully', 'quiz_id' => $quizId];
        } else {
            $stmt->close();
            return ['status' => 500, 'message' => 'Failed to create quiz'];
        }
    }

    public function getUserQuizzes($userId)
    {
        //prepare an SQL statement to fetch quizzes from the user_quizzes table
        $stmt = $this->conn->prepare("SELECT id, name, description, is_public, created_at FROM user_quizzes WHERE user_id = ?");
        $stmt->bind_param("i", $userId);
        $stmt->execute();
        $result = $stmt->get_result();

        //collect the results into an array
        $quizzes = [];
        while ($row = $result->fetch_assoc()) {
            $quizzes[] = $row;
        }
        $stmt->close();

        return ['status' => 200, 'quizzes' => $quizzes];
    }

    public function getPublicQuizzes()
    {
        $quizModel = new Quiz($this->conn);
        $quizzes = $quizModel->getPublicQuizzes();

        return ['status' => 200, 'quizzes' => $quizzes];
    }

    //get quiz details for a given quiz id and user id.
    public function getQuizById($quizId, $userId) {
        $stmt = $this->conn->prepare("SELECT * FROM user_quizzes WHERE id = ? AND user_id = ?");
        $stmt->bind_param("ii", $quizId, $userId);
        $stmt->execute();
        $result = $stmt->get_result();
        $quiz = $result->fetch_assoc();
        $stmt->close();
    
        return $quiz ?: null;
    }
    
    //update quiz details.
    public function edit($data, $userId)
    {
        if (empty($data['quiz_id']) || empty($data['name'])) {
            return ['status' => 400, 'message' => 'Quiz id and name are required'];
        }
        $quizId = intval($data['quiz_id']);
        $name = trim($data['name']);
        $description = trim($data['description'] ?? '');
        $isPublic = isset($data['is_public']) && $data['is_public'] ? 1 : 0;

        $quizModel = new Quiz($this->conn);
        $updated = $quizModel->update($quizId, $userId, $name, $description, $isPublic);
        if ($updated) {
            return ['status' => 200, 'message' => 'Quiz updated successfully'];
        } else {
            return ['status' => 500, 'message' => 'Failed to update quiz'];
        }
    }

    public function getQuizQuestions($quizId, $userId = null)
    {
        //fetch the quiz details to determine privacy.
        $stmt = $this->conn->prepare("SELECT user_id, is_public FROM user_quizzes WHERE id = ?");
        $stmt->bind_param("i", $quizId);
        $stmt->execute();
        $result = $stmt->get_result();
        $quiz = $result->fetch_assoc();
        $stmt->close();

        if (!$quiz) {
            return ['status' => 404, 'message' => 'Quiz not found'];
        }

        //if the quiz is private, only allow its creator to fetch questions.
        if (!$quiz['is_public']) {
            if (!$userId) {
                return ['status' => 401, 'message' => 'Unauthorized: Private quiz'];
            }
            if ($quiz['user_id'] != $userId) {
                return ['status' => 403, 'message' => 'Forbidden: You do not own this quiz'];
            }
        }

        $stmt = $this->conn->prepare(
            "SELECT q.id, q.question, q.option_a, q.option_b, q.option_c, q.option_d, q.correct_option
         FROM questions q
         JOIN user_quiz_questions uq ON q.id = uq.question_id
         WHERE uq.quiz_id = ?"
        );
        $stmt->bind_param("i", $quizId);
        $stmt->execute();
        $result = $stmt->get_result();
        $questions = [];
        while ($row = $result->fetch_assoc()) {
            $questions[] = $row;
        }
        $stmt->close();
        return ['status' => 200, 'questions' => $questions];
    }
    public function deleteQuiz($quizId, $userId)
    {
        //verify the quiz belongs to the user.
        $stmt = $this->conn->prepare("SELECT id FROM user_quizzes WHERE id = ? AND user_id = ?");
        $stmt->bind_param("ii", $quizId, $userId);
        $stmt->execute();
        $result = $stmt->get_result();
        $quiz = $result->fetch_assoc();
        $stmt->close();
        if (!$quiz) {
            return ['status' => 404, 'message' => 'Quiz not found or not authorized'];
        }
        //delete the quiz.
        $stmt = $this->conn->prepare("DELETE FROM user_quizzes WHERE id = ? AND user_id = ?");
        $stmt->bind_param("ii", $quizId, $userId);
        if ($stmt->execute()) {
            $stmt->close();
            return ['status' => 200, 'message' => 'Quiz deleted successfully'];
        } else {
            $stmt->close();
            return ['status' => 500, 'message' => 'Failed to delete quiz'];
        }
    }

    public function deleteQuizQuestion($quizId, $questionId, $userId)
    {
        //verify the quiz belongs to the user.
        $stmt = $this->conn->prepare("SELECT id FROM user_quizzes WHERE id = ? AND user_id = ?");
        $stmt->bind_param("ii", $quizId, $userId);
        $stmt->execute();
        $result = $stmt->get_result();
        $quiz = $result->fetch_assoc();
        $stmt->close();
        if (!$quiz) {
            return ['status' => 404, 'message' => 'Quiz not found or not authorized'];
        }
        //remove the question link from the quiz.
        $stmt = $this->conn->prepare("DELETE FROM user_quiz_questions WHERE quiz_id = ? AND question_id = ?");
        $stmt->bind_param("ii", $quizId, $questionId);
        if ($stmt->execute()) {
            $stmt->close();
            return ['status' => 200, 'message' => 'Question deleted from quiz'];
        } else {
            $stmt->close();
            return ['status' => 500, 'message' => 'Failed to delete question from quiz'];
        }
    }

    public function updateQuizQuestion($quizId, $questionId, $userId, $updatedQuestion)
    {
        //confirm the quiz belongs to the user
        $stmt = $this->conn->prepare("SELECT id FROM user_quizzes WHERE id = ? AND user_id = ?");
        $stmt->bind_param("ii", $quizId, $userId);
        $stmt->execute();
        $result = $stmt->get_result();
        $quiz = $result->fetch_assoc();
        $stmt->close();

        if (!$quiz) {
            return ['status' => 404, 'message' => 'Quiz not found or not authorized'];
        }

        //confirm the question is linked to this quiz (so the user can only edit questions in their quiz)
        $stmt = $this->conn->prepare("
        SELECT question_id 
        FROM user_quiz_questions 
        WHERE quiz_id = ? AND question_id = ? 
        LIMIT 1
    ");
        $stmt->bind_param("ii", $quizId, $questionId);
        $stmt->execute();
        $result = $stmt->get_result();
        $questionLink = $result->fetch_assoc();
        $stmt->close();

        if (!$questionLink) {
            return ['status' => 404, 'message' => 'Question not found in this quiz'];
        }

        //validate the correct_option
        $validOptions = ['A', 'B', 'C', 'D', 'a', 'b', 'c', 'd'];
        if (!in_array($updatedQuestion['correct_option'], $validOptions)) {
            return ['status' => 400, 'message' => 'Invalid correct option. Must be A, B, C, or D'];
        }

        //update the question row in the questions table
        $stmt = $this->conn->prepare("
        UPDATE questions q
        INNER JOIN user_quiz_questions uq ON q.id = uq.question_id
        SET q.question = ?,
            q.option_a = ?,
            q.option_b = ?,
            q.option_c = ?,
            q.option_d = ?,
            q.correct_option = ?
        WHERE uq.quiz_id = ? AND uq.question_id = ?
    ");
        if (!$stmt) {
            return ['status' => 500, 'message' => 'Failed to prepare statement'];
        }
        $correctOption = strtoupper($updatedQuestion['correct_option']);
        $stmt->bind_param(
            "ssssssii",
            $updatedQuestion['question'],
            $updatedQuestion['option_a'],
            $updatedQuestion['option_b'],
            $updatedQuestion['option_c'],
            $updatedQuestion['option_d'],
            $correctOption,
            $quizId,
            $questionId
        );
        $success = $stmt->execute();
        $stmt->close();

        if (!$success) {
            return ['status' => 500, 'message' => 'Failed to update question'];
        }

        return ['status' => 200, 'message' => 'Question updated successfully'];
    }
}
