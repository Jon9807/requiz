<?php
// Backend/Model/Question.php
namespace Model;

class Question
{
    private $conn;

    public function __construct($conn) {
        $this->conn = $conn;
    }

    public function create(
        $userId,
        $categoryId,
        $difficulty,
        $questionText,
        $optionA,
        $optionB,
        $optionC,
        $optionD,
        $correctOption,
        $subcategoryId = null
    ) {
        $sql = "INSERT INTO questions (
                    user_id, category_id, subcategory_id, difficulty, question,
                    option_a, option_b, option_c, option_d, correct_option, created_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())";

        $stmt = $this->conn->prepare($sql);
        if (!$stmt) return false;

        if ($subcategoryId === null) {
            $stmt->bind_param(
                "iissssssss",
                $userId,
                $categoryId,
                $subcategoryId,
                $difficulty,
                $questionText,
                $optionA,
                $optionB,
                $optionC,
                $optionD,
                $correctOption
            );
        } else {
            $stmt->bind_param(
                "iiisssssss",
                $userId,
                $categoryId,
                $subcategoryId,
                $difficulty,
                $questionText,
                $optionA,
                $optionB,
                $optionC,
                $optionD,
                $correctOption
            );
        }

        $result = $stmt->execute();
        if ($result) {
            $questionId = $stmt->insert_id;
            $stmt->close();
            return $questionId;
        } else {
            $stmt->close();
            return false;
        }
    }
}
