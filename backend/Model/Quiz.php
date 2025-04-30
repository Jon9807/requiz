<?php
//Backend/Model/Quiz.Php

namespace Model;

class Quiz
{
    private $conn;

    //constructor: accepts a database connection.
    public function __construct($conn)
    {
        $this->conn = $conn;
    }

    //create a new quiz.
    public function create($userId, $name, $description, $isPublic)
    {
        $stmt = $this->conn->prepare("INSERT INTO user_quizzes (user_id, name, description, is_public, created_at) VALUES (?, ?, ?, ?, NOW())");
        $stmt->bind_param("issi", $userId, $name, $description, $isPublic);
        $result = $stmt->execute();
        if ($result) {
            $quizId = $stmt->insert_id;
            $stmt->close();
            return $quizId;
        } else {
            $stmt->close();
            return false;
        }
    }

    //fetch public quizzes
    public function getPublicQuizzes()
    {
        $stmt = $this->conn->prepare("SELECT q.id, q.name, q.description, q.is_public, q.created_at, u.username AS creator
            FROM user_quizzes q
            JOIN users u ON q.user_id = u.id
            WHERE q.is_public = 1
            ORDER BY q.created_at DESC");
        $stmt->execute();
        $result = $stmt->get_result();

        $quizzes = [];
        while ($row = $result->fetch_assoc()) {
            $quizzes[] = $row;
        }
        $stmt->close();

        return $quizzes;
    }

    //update an existing quiz (only if it belongs to the user)
    public function update($quizId, $userId, $name, $description, $isPublic)
    {
        $stmt = $this->conn->prepare("UPDATE user_quizzes SET name = ?, description = ?, is_public = ? WHERE id = ? AND user_id = ?");
        $stmt->bind_param("ssiii", $name, $description, $isPublic, $quizId, $userId);
        $result = $stmt->execute();
        $affected = $stmt->affected_rows;
        $stmt->close();
        return ($result && $affected > 0);
    }

    //fetch a quiz by id and user_id (for editing)
    public function getById($quizId, $userId)
    {
        $stmt = $this->conn->prepare("SELECT id, name, description, is_public, created_at FROM user_quizzes WHERE id = ? AND user_id = ? LIMIT 1");
        $stmt->bind_param("ii", $quizId, $userId);
        $stmt->execute();
        $result = $stmt->get_result();
        $quiz = $result->fetch_assoc();
        $stmt->close();
        return $quiz;
    }
}
