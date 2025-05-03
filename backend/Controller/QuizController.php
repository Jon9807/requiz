<?php
// backend/Controller/QuizController.php

namespace Controller;

use Model\Quiz;

class QuizController
{
    private $conn;
    private $secretKey;

    //Constructor: accepts the database connection and secret key
    public function __construct($conn, $secretKey)
    {
        $this->conn      = $conn;
        $this->secretKey = $secretKey;
    }


    public function create(array $data, int $userId): array
    {
        $name          = trim($data['name'] ?? '');
        $description   = trim($data['description'] ?? '');
        $isPublic      = isset($data['is_public']) ? (int)$data['is_public'] : 0;
        $categoryId    = isset($data['category_id']) ? (int)$data['category_id'] : 0;
        $subcategoryId = isset($data['subcategory_id']) ? (int)$data['subcategory_id'] : null;
        $difficulty    = in_array($data['difficulty'] ?? '', ['Easy', 'Medium', 'Hard'])
            ? $data['difficulty']
            : 'Medium';

        if ($name === '' || $categoryId === 0) {
            return ['status' => 400, 'message' => 'Quiz name and category are required'];
        }

        $stmt = $this->conn->prepare(
            "INSERT INTO user_quizzes
              (user_id, category_id, subcategory_id, difficulty,
               name, description, is_public, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, NOW())"
        );
        $stmt->bind_param(
            "iiisssi",
            $userId,
            $categoryId,
            $subcategoryId,
            $difficulty,
            $name,
            $description,
            $isPublic
        );

        if ($stmt->execute()) {
            $quizId = $stmt->insert_id;
            $stmt->close();
            return ['status' => 201, 'message' => 'Quiz created successfully', 'quiz_id' => $quizId];
        } else {
            $stmt->close();
            return ['status' => 500, 'message' => 'Failed to create quiz'];
        }
    }

    
    public function getUserQuizzes(int $userId): array
    {
        $quizModel = new Quiz($this->conn);
        $quizzes   = $quizModel->getUserQuizzes($userId);
        return ['status' => 200, 'quizzes' => $quizzes];
    }

    
    public function getPublicQuizzes(): array
    {
        $quizModel = new Quiz($this->conn);
        $quizzes   = $quizModel->getPublicQuizzes();

        return ['status' => 200, 'quizzes' => $quizzes];
    }

   
    public function getQuizById(int $quizId, ?int $userId = null): ?array
    {
        $sql = "
            SELECT
              q.*, c.name AS category_name, s.name AS subcategory_name
            FROM user_quizzes q
            JOIN categories c ON q.category_id = c.id
            LEFT JOIN subcategories s ON q.subcategory_id = s.id
            WHERE q.id = ? "
            . ($userId !== null
                ? "AND (q.is_public = 1 OR q.user_id = ?) "
                : "AND q.is_public = 1 ")
            . "LIMIT 1";

        $stmt = $this->conn->prepare($sql);
        if (!$stmt) {
            return null;
        }
        if ($userId !== null) {
            $stmt->bind_param("ii", $quizId, $userId);
        } else {
            $stmt->bind_param("i", $quizId);
        }
        $stmt->execute();
        $quiz = $stmt->get_result()->fetch_assoc();
        $stmt->close();

        return $quiz ?: null;
    }

    public function edit(array $data, int $userId): array
    {
        $quizId      = isset($data['quiz_id']) ? (int)$data['quiz_id'] : 0;
        $name        = trim($data['name'] ?? '');
        $description = trim($data['description'] ?? '');
        $isPublic    = !empty($data['is_public']) ? 1 : 0;
        $difficulty  = in_array($data['difficulty'] ?? '', ['Easy', 'Medium', 'Hard'])
            ? $data['difficulty']
            : 'Medium';

        if ($quizId === 0 || $name === '') {
            return ['status' => 400, 'message' => 'Quiz id and name are required'];
        }

        // Only update the fields the form actually sends
        $stmt = $this->conn->prepare("
        UPDATE user_quizzes
           SET name        = ?,
               description = ?,
               is_public   = ?,
               difficulty  = ?
         WHERE id = ? AND user_id = ?
    ");
        $stmt->bind_param(
            'ssisii',
            $name,
            $description,
            $isPublic,
            $difficulty,
            $quizId,
            $userId
        );
        if (! $stmt->execute() || $stmt->affected_rows === 0) {
            $stmt->close();
            return ['status' => 500, 'message' => 'Failed to update quiz'];
        }
        $stmt->close();

        $sync = $this->conn->prepare("
        UPDATE questions q
        JOIN user_quiz_questions uq ON uq.question_id = q.id
           SET q.difficulty = ?
         WHERE uq.quiz_id = ?
    ");
        $sync->bind_param("si", $difficulty, $quizId);
        $sync->execute();
        $sync->close();

        return ['status' => 200, 'message' => 'Quiz updated successfully'];
    }

    //Fetch questions for a quiz, enforcing privacy.
    public function getQuizQuestions(int $quizId, ?int $userId = null): array
    {
        // check quiz existence & privacy
        $stmt = $this->conn->prepare(
            "SELECT user_id, is_public, difficulty
             FROM user_quizzes WHERE id = ?"
        );
        $stmt->bind_param("i", $quizId);
        $stmt->execute();
        $result = $stmt->get_result();
        if ($result->num_rows === 0) {
            return ['status' => 404, 'message' => 'Quiz not found'];
        }
        $quiz = $result->fetch_assoc();
        $stmt->close();

        if (!$quiz['is_public']) {
            if ($userId === null || $quiz['user_id'] != $userId) {
                return ['status' => 403, 'message' => 'Unauthorized'];
            }
        }

        $stmt = $this->conn->prepare(
            "SELECT q.id, q.question, q.option_a, q.option_b, q.option_c,
                    q.option_d, q.correct_option
             FROM questions q
             JOIN user_quiz_questions uq ON q.id = uq.question_id
             WHERE uq.quiz_id = ?"
        );
        $stmt->bind_param("i", $quizId);
        $stmt->execute();
        $rows = $stmt->get_result();
        $questions = [];
        while ($r = $rows->fetch_assoc()) {
            $questions[] = $r;
        }
        $stmt->close();

        return ['status' => 200, 'questions' => $questions];
    }

    
     //Delete a quiz owned by the user.
     
    public function deleteQuiz(int $quizId, int $userId): array
    {
        $stmt = $this->conn->prepare(
            "DELETE FROM user_quizzes WHERE id = ? AND user_id = ?"
        );
        $stmt->bind_param("ii", $quizId, $userId);
        if ($stmt->execute()) {
            $stmt->close();
            return ['status' => 200, 'message' => 'Quiz deleted successfully'];
        }
        $stmt->close();
        return ['status' => 500, 'message' => 'Failed to delete quiz'];
    }

    //Remove a question from a quiz.
     
    public function deleteQuizQuestion(int $quizId, int $questionId, int $userId): array
    {
        // verify ownership
        $stmt = $this->conn->prepare(
            "SELECT id FROM user_quizzes WHERE id = ? AND user_id = ?"
        );
        $stmt->bind_param("ii", $quizId, $userId);
        $stmt->execute();
        if ($stmt->get_result()->num_rows === 0) {
            $stmt->close();
            return ['status' => 404, 'message' => 'Quiz not found or unauthorized'];
        }
        $stmt->close();

        $stmt = $this->conn->prepare(
            "DELETE FROM user_quiz_questions WHERE quiz_id = ? AND question_id = ?"
        );
        $stmt->bind_param("ii", $quizId, $questionId);
        if ($stmt->execute()) {
            $stmt->close();
            return ['status' => 200, 'message' => 'Question removed from quiz'];
        }
        $stmt->close();
        return ['status' => 500, 'message' => 'Failed to remove question from quiz'];
    }

    
    //Update a question within a quiz.

    public function updateQuizQuestion(int $quizId, int $questionId, int $userId, array $updatedQuestion): array
    {
        // verify ownership & link
        $stmt = $this->conn->prepare(
            "SELECT uq.question_id FROM user_quizzes uqz
             JOIN user_quiz_questions uq ON uq.quiz_id = uqz.id
             WHERE uqz.id = ? AND uqz.user_id = ? AND uq.question_id = ? LIMIT 1"
        );
        $stmt->bind_param("iii", $quizId, $userId, $questionId);
        $stmt->execute();
        if ($stmt->get_result()->num_rows === 0) {
            $stmt->close();
            return ['status' => 404, 'message' => 'Quiz or question not found or unauthorized'];
        }
        $stmt->close();

        // validate correct_option
        $opt = strtoupper(trim($updatedQuestion['correct_option'] ?? ''));
        if (!in_array($opt, ['A', 'B', 'C', 'D'])) {
            return ['status' => 400, 'message' => 'Invalid correct option'];
        }

        // update question
        $stmt = $this->conn->prepare(
            "UPDATE questions q
             JOIN user_quiz_questions uq ON uq.question_id = q.id
             SET q.question       = ?,
                 q.option_a       = ?,
                 q.option_b       = ?,
                 q.option_c       = ?,
                 q.option_d       = ?,
                 q.correct_option = ?
             WHERE uq.quiz_id = ? AND uq.question_id = ?"
        );
        $stmt->bind_param(
            "ssssssii",
            $updatedQuestion['question'],
            $updatedQuestion['option_a'],
            $updatedQuestion['option_b'],
            $updatedQuestion['option_c'],
            $updatedQuestion['option_d'],
            $opt,
            $quizId,
            $questionId
        );
        $ok = $stmt->execute();
        $stmt->close();

        if (!$ok) {
            return ['status' => 500, 'message' => 'Failed to update question'];
        }
        return ['status' => 200, 'message' => 'Question updated successfully'];
    }
}
