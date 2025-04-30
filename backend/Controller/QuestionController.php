<?php
// Backend/Controller/QuestionController.php
namespace Controller;

/**
 * Strip smart quotes, control-chars and escape for SQL.
 *
 * @param string $text
 * @return string
 */
function sanitizeQuestion(string $text): string
{
    $text = trim($text);
    $text = preg_replace('/[\r\n\t]+/', ' ', $text);
    $replacements = [
        '‘' => "'",
        '’' => "'",
        '“' => '"',
        '”' => '"',
        '—' => '-',
        '–' => '-',
        '…' => '...',
        '•' => '-',
    ];
    $text = strtr($text, $replacements);
    $text = str_replace("'", "''", $text);
    return $text;
}

use Model\Question;

class QuestionController
{
    private $conn;
    private $secretKey;

    public function __construct($conn, $secretKey)
    {
        $this->conn = $conn;
        $this->secretKey = $secretKey;
    }

    public function createQuizQuestion($data, $userId)
    {
        if (
            empty($data['quiz_id']) || empty($data['question']) ||
            empty($data['option_a']) || empty($data['option_b']) ||
            empty($data['option_c']) || empty($data['option_d']) ||
            empty($data['correct_option'])
        ) {
            return ['status' => 400, 'message' => 'All fields are required'];
        }

        $quizId = intval($data['quiz_id']);
        $questionText = sanitizeQuestion($data['question']);
        $optionA      = sanitizeQuestion($data['option_a']);
        $optionB      = sanitizeQuestion($data['option_b']);
        $optionC      = sanitizeQuestion($data['option_c']);
        $optionD      = sanitizeQuestion($data['option_d']);
        $correctOption = strtoupper(trim($data['correct_option']));

        if (!in_array($correctOption, ['A', 'B', 'C', 'D'])) {
            return ['status' => 400, 'message' => 'Correct option must be A, B, C, or D'];
        }

        //Fetch the quiz's category and subcategory
        $stmt = $this->conn->prepare("SELECT category_id, subcategory_id FROM user_quizzes WHERE id = ?");
        $stmt->bind_param("i", $quizId);
        $stmt->execute();
        $result = $stmt->get_result();
        if ($result->num_rows === 0) {
            $stmt->close();
            return ['status' => 400, 'message' => 'Quiz not found'];
        }
        $quiz = $result->fetch_assoc();
        $stmt->close();

        $categoryId = intval($quiz['category_id']);
        $quizSubcatId = $quiz['subcategory_id'] ? intval($quiz['subcategory_id']) : null;

        //Determine subcategory
        $subcategoryId = $quizSubcatId;
        if (!$subcategoryId && isset($data['subcategory_id'])) {
            $subcategoryId = intval($data['subcategory_id']);

            $checkStmt = $this->conn->prepare("SELECT id FROM subcategories WHERE id = ? AND category_id = ?");
            $checkStmt->bind_param("ii", $subcategoryId, $categoryId);
            $checkStmt->execute();
            $checkResult = $checkStmt->get_result();
            if ($checkResult->num_rows === 0) {
                $checkStmt->close();
                return ['status' => 400, 'message' => 'Invalid subcategory for selected category'];
            }
            $checkStmt->close();
        }

        $difficulty = 'Medium'; //stat for now

        $questionModel = new Question($this->conn);
        $questionId = $questionModel->create(
            $userId,
            $categoryId,
            $difficulty,
            $questionText,
            $optionA,
            $optionB,
            $optionC,
            $optionD,
            $correctOption,
            $subcategoryId
        );

        if (!$questionId) {
            return ['status' => 500, 'message' => 'Failed to create question'];
        }

        $stmt = $this->conn->prepare("INSERT INTO user_quiz_questions (quiz_id, question_id) VALUES (?, ?)");
        if (!$stmt) {
            return ['status' => 500, 'message' => 'Failed to prepare linking statement'];
        }
        $stmt->bind_param("ii", $quizId, $questionId);
        if ($stmt->execute()) {
            $stmt->close();
            return ['status' => 201, 'message' => 'Question created and added to quiz', 'question_id' => $questionId];
        } else {
            $stmt->close();
            return ['status' => 500, 'message' => 'Question created but failed to link to quiz'];
        }
    }
}
