<?php
// backend/index.php
require __DIR__ . '/vendor/autoload.php';
require __DIR__ . '/config.php';
require_once 'db.php';

use Controller\UserController;
use Controller\QuizController;
use Controller\QuestionController;
use Controller\OpenAIController;
use View\Response;
use Firebase\JWT\JWT;
use Firebase\JWT\Key;

// Handle preflight OPTIONS request for CORS.
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    header("Access-Control-Allow-Origin: *");
    header("Access-Control-Allow-Methods: POST, GET, OPTIONS");
    header("Access-Control-Allow-Headers: Content-Type, Authorization");
    http_response_code(200);
    exit();
}

// Set response headers.
header("Content-Type: application/json; charset=utf-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

//get the action parameter from the URL query string.
$action = $_GET['action'] ?? '';

//handle the AI-generated quiz endpoint.
if ($action === 'generate_quiz') {
    $category     = $_GET['category'] ?? 'General';
    $difficulty   = $_GET['difficulty'] ?? 'Medium';
    $numQuestions = isset($_GET['num']) ? intval($_GET['num']) : 5;

    //create an instance of the OpenAIController using OpenAI API key.
    $openaiCtrl = new OpenAIController($openaiApiKey);

    //generate the quiz.
    $quizData = $openaiCtrl->generateQuiz($category, $difficulty, $numQuestions);

    //return the result.
    if (isset($quizData['error'])) {
        Response::json(['status' => 400, 'error' => $quizData['error']], 400);
    } else {
        Response::json($quizData, 200);
    }
    exit;
}


//require authentication.
$requiresAuth = in_array($action, [
    'login',
    'register',
    'create_quiz',
    'create_quiz_question',
    'get_user_quizzes',
    'get_quiz_details',
    'edit_quiz',
    'get_profile',
    'update_profile',
    'get_admin_stats',
    'get_all_questions',
    'delete_question',
    'delete_quiz_question',
    'update_question',
    'get_all_quizzes',
    'delete_quiz',
    'admin_delete_quiz',
    'update_quiz',
    'admin_create_quiz',
    'get_all_users',
    'delete_user',
    'update_user',
    'update_quiz_question',
    'get_user_sessions',
    'delete_session',
    'remove_profile_pic'
]);




$userId = null;
if ($requiresAuth && $action !== 'login' && $action !== 'register') {
    $headers = getallheaders();
    $authHeader = $headers['Authorization'] ?? '';
    if (strpos($authHeader, 'Bearer ') !== 0) {
        Response::json(["message" => "No token provided"], 401);
    }
    $jwt = substr($authHeader, 7);
    try {
        $decoded = JWT::decode($jwt, new Key($secretKey, 'HS256'));
        $userId = $decoded->user_id;
    } catch (\Exception $e) {
        Response::json(["message" => "Invalid token"], 401);
    }
}

//route actions.
if ($action === 'login') {
    $data = json_decode(file_get_contents("php://input"), true);
    $userController = new UserController($conn, $secretKey);
    $result = $userController->login($data);
    Response::json($result, $result['status']);
} elseif ($action === 'register') {
    $data = json_decode(file_get_contents("php://input"), true);
    $userController = new UserController($conn, $secretKey);
    $result = $userController->register($data);
    Response::json($result, $result['status']);
} elseif ($action === 'create_quiz') {
    $data = json_decode(file_get_contents("php://input"), true);
    if (!$userId) {
        Response::json(["message" => "Unauthorized"], 401);
    }
    $quizController = new QuizController($conn, $secretKey);
    $result = $quizController->create($data, $userId);
    Response::json($result, $result['status']);
} elseif ($action === 'create_quiz_question') {
    $data = json_decode(file_get_contents("php://input"), true);
    if (!$userId) {
        Response::json(["message" => "Unauthorized"], 401);
    }
    $questionController = new QuestionController($conn, $secretKey);
    $result = $questionController->createQuizQuestion($data, $userId);
    Response::json($result, $result['status']);
} elseif ($action === 'get_user_quizzes') {
    if (!$userId) {
        Response::json(["message" => "Unauthorized"], 401);
    }
    $quizController = new QuizController($conn, $secretKey);
    $result = $quizController->getUserQuizzes($userId);
    Response::json($result, $result['status']);
} elseif ($action === 'get_quiz_details') {
    if (!$userId) {
        Response::json(["message" => "Unauthorized"], 401);
    }
    $quizId = isset($_GET['quiz_id']) ? intval($_GET['quiz_id']) : 0;
    if (!$quizId) {
        Response::json(["message" => "Invalid quiz id"], 400);
    }
    $quizController = new QuizController($conn, $secretKey);
    $quiz = $quizController->getQuizById($quizId, $userId);
    if (!$quiz) {
        Response::json(["message" => "Quiz not found or not authorized"], 404);
    } else {
        Response::json($quiz, 200);
    }
} elseif ($action === 'edit_quiz') {
    $data = json_decode(file_get_contents("php://input"), true);
    if (!$userId) {
        Response::json(["message" => "Unauthorized"], 401);
    }
    $quizController = new QuizController($conn, $secretKey);
    $result = $quizController->edit($data, $userId);
    Response::json($result, $result['status']);
} elseif ($action === 'public_quizzes') {
    $quizController = new QuizController($conn, $secretKey);
    $result = $quizController->getPublicQuizzes();
    Response::json($result, $result['status']);
} elseif ($action === 'get_quiz_questions') {
    $quizId = isset($_GET['quiz_id']) ? intval($_GET['quiz_id']) : 0;
    if (!$quizId) {
        Response::json(["message" => "Invalid quiz id"], 400);
    }

    //load the quiz row
    $stmt = $conn->prepare("
      SELECT user_id, is_public, category_id
      FROM user_quizzes
      WHERE id = ?
    ");
    $stmt->bind_param("i", $quizId);
    $stmt->execute();
    $quizRow = $stmt->get_result()->fetch_assoc();
    $stmt->close();

    if (!$quizRow) {
        Response::json(["message" => "Quiz not found"], 404);
    }

    //decode JWT if present
    $headers = getallheaders();
    $jwt     = isset($headers['Authorization']) && str_starts_with($headers['Authorization'], 'Bearer ')
        ? substr($headers['Authorization'], 7)
        : null;
    $userId  = null;
    if ($jwt) {
        try {
            $decoded = JWT::decode($jwt, new Key($secretKey, 'HS256'));
            $userId  = $decoded->user_id;
        } catch (\Exception $e) {
            //invalid token = guest
        }
    }

    //enforce private/quota
    if (!$quizRow['is_public'] && $quizRow['user_id'] !== $userId) {
        Response::json(["message" => "Unauthorized"], 401);
    }

    //fetch the questions
    $quizCtrl = new \Controller\QuizController($conn, $secretKey);
    $res       = $quizCtrl->getQuizQuestions($quizId, $userId);
    $questions = $res['questions'] ?? [];

    //return them + the category_id for session saving
    Response::json([
        "questions"   => $questions,
        "category_id" => intval($quizRow['category_id'])
    ], 200);
    exit;
}


// Save a completed quiz session (score + duration)
elseif ($action === 'save_session') {
    $data = json_decode(file_get_contents("php://input"), true);

    if (
        empty($data['user_id']) ||
        empty($data['quiz_id']) ||
        empty($data['category_id']) ||
        !isset($data['score']) ||
        !isset($data['questions_answered']) ||
        !isset($data['duration_seconds'])
    ) {
        Response::json(["message" => "Incomplete session data"], 400);
        exit;
    }

    $stmt = $conn->prepare("
      INSERT INTO game_sessions
        (user_id, quiz_id, category_id, score, questions_answered, duration_seconds, status, created_at)
      VALUES (?,       ?,       ?,           ?,     ?,                  ?,                'Completed', NOW())
    ");
    $stmt->bind_param(
        "iiiiii",
        $data['user_id'],
        $data['quiz_id'],
        $data['category_id'],
        $data['score'],
        $data['questions_answered'],
        $data['duration_seconds']
    );
    $stmt->execute();
    $stmt->close();

    Response::json(["message" => "Session saved"], 201);
    exit;
} elseif ($action === 'get_user_sessions') {
    $stmt = $conn->prepare("
          SELECT
            gs.id,
            uq.name           AS quiz_name,
            c.name            AS category_name,
            gs.score,
            gs.questions_answered,
            gs.duration_seconds,
            gs.created_at
          FROM game_sessions gs
          LEFT JOIN user_quizzes uq ON uq.id = gs.quiz_id
          JOIN categories    c  ON c.id  = gs.category_id
          WHERE gs.user_id = ?
          ORDER BY gs.created_at DESC
        ");
    $stmt->bind_param("i", $userId);
    $stmt->execute();
    $res = $stmt->get_result();
    $sessions = [];
    while ($row = $res->fetch_assoc()) {
        $sessions[] = $row;
    }
    $stmt->close();

    Response::json(['sessions' => $sessions], 200);
    exit;
} elseif ($action === 'delete_quiz') {
    if (!$userId) {
        Response::json(["message" => "Unauthorized"], 401);
    }
    $data = json_decode(file_get_contents("php://input"), true);
    $quizId = isset($data['quiz_id']) ? intval($data['quiz_id']) : 0;
    if (!$quizId) {
        Response::json(["message" => "Invalid quiz id"], 400);
    }
    $quizController = new QuizController($conn, $secretKey);
    $result = $quizController->deleteQuiz($quizId, $userId);
    Response::json($result, $result['status']);
} elseif ($action === 'delete_quiz_question') {
    if (!$userId) {
        Response::json(["message" => "Unauthorized"], 401);
    }
    $data = json_decode(file_get_contents("php://input"), true);
    $quizId = isset($data['quiz_id']) ? intval($data['quiz_id']) : 0;
    $questionId = isset($data['question_id']) ? intval($data['question_id']) : 0;
    if (!$quizId || !$questionId) {
        Response::json(["message" => "Invalid quiz id or question id"], 400);
    }
    $quizController = new QuizController($conn, $secretKey);
    $result = $quizController->deleteQuizQuestion($quizId, $questionId, $userId);
    Response::json($result, $result['status']);
} elseif ($action === 'update_quiz_question') {
    if (!$userId) {
        Response::json(["message" => "Unauthorized"], 401);
    }
    $data = json_decode(file_get_contents("php://input"), true);

    //validate required fields
    $quizId = isset($data['quiz_id']) ? intval($data['quiz_id']) : 0;
    $questionId = isset($data['question_id']) ? intval($data['question_id']) : 0;
    if (!$quizId || !$questionId) {
        Response::json(["message" => "Invalid quiz id or question id"], 400);
    }

    //the question text and options
    $updatedQuestion = [
        'question'       => $data['question']       ?? '',
        'option_a'       => $data['option_a']       ?? '',
        'option_b'       => $data['option_b']       ?? '',
        'option_c'       => $data['option_c']       ?? '',
        'option_d'       => $data['option_d']       ?? '',
        'correct_option' => $data['correct_option'] ?? '',
    ];

    $quizController = new QuizController($conn, $secretKey);
    $result = $quizController->updateQuizQuestion($quizId, $questionId, $userId, $updatedQuestion);
    Response::json($result, $result['status']);
} elseif ($action === 'get_profile') {
    if (!$userId) {
        Response::json(["message" => "Unauthorized"], 401);
    }
    //use the User model to fetch the profile info.
    require_once 'Model/User.php';
    $userModel = new \Model\User($conn);
    $user = $userModel->getById($userId);
    if ($user) {
        // If display_name is null, default to username.
        if (empty($user['display_name'])) {
            $user['display_name'] = $user['username'];
        }
        Response::json($user, 200);
    } else {
        Response::json(["message" => "User not found"], 404);
    }
} elseif ($action === 'update_profile') {
    if (!$userId) {
        Response::json(["message" => "Unauthorized"], 401);
    }

    $profile_pic_path = null;
    if (!empty($_FILES)) {
        if (isset($_FILES['profile_pic']) && $_FILES['profile_pic']['error'] === UPLOAD_ERR_OK) {
            $uploadDir = __DIR__ . '/uploads/profile_pics/';
            if (!file_exists($uploadDir)) mkdir($uploadDir, 0777, true);
            $filename = time() . '_' . basename($_FILES['profile_pic']['name']);
            if (move_uploaded_file($_FILES['profile_pic']['tmp_name'], "$uploadDir$filename")) {
                $profile_pic_path = 'uploads/profile_pics/' . $filename;
            } else {
                Response::json(["message" => "Failed to move uploaded file"], 500);
            }
        }
    }

    // get fields from POST (multipart) or JSON
    $data = $_POST ?: json_decode(file_get_contents("php://input"), true);

    $username     = isset($data['username'])     ? trim($data['username'])     : null;
    $display_name = isset($data['display_name']) ? trim($data['display_name']) : null;
    $email        = isset($data['email'])        ? trim($data['email'])        : null;
    $bio          = isset($data['bio'])          ? trim($data['bio'])          : null;

    // now update username, display_name, email, bio, and profile_pic
    $stmt = $conn->prepare("
        UPDATE users
        SET
          username     = COALESCE(?, username),
          display_name = COALESCE(?, display_name),
          email        = COALESCE(?, email),
          bio          = ?,
          profile_pic  = COALESCE(?, profile_pic)
        WHERE id = ?
    ");
    $stmt->bind_param(
        "sssssi",
        $username,
        $display_name,
        $email,
        $bio,
        $profile_pic_path,
        $userId
    );

    if ($stmt->execute()) {
        $stmt->close();
        Response::json(["message" => "Profile updated successfully"], 200);
    } else {
        $stmt->close();
        Response::json(["message" => "Failed to update profile"], 500);
    }
} elseif ($action === 'search_public_quizzes') {
    // Get the search term from the query string
    $q = isset($_GET['q']) ? trim($_GET['q']) : "";
    $searchTerm = "%" . $q . "%";

    //only search among public quizzes (is_public = 1)
    $stmt = $conn->prepare("SELECT q.id, q.name, q.description, q.is_public, q.created_at, u.username AS creator
                            FROM user_quizzes q 
                            JOIN users u ON q.user_id = u.id 
                            WHERE q.is_public = 1 AND q.name LIKE ?
                            ORDER BY q.created_at DESC");
    $stmt->bind_param("s", $searchTerm);
    $stmt->execute();
    $result = $stmt->get_result();
    $quizzes = [];
    while ($row = $result->fetch_assoc()) {
        $quizzes[] = $row;
    }
    $stmt->close();
    \View\Response::json(["quizzes" => $quizzes], 200);
}
// List subcategories for a given category
elseif ($action === 'get_subcategories') {
    $catId = isset($_GET['category_id']) ? intval($_GET['category_id']) : 0;
    if ($catId > 0) {
        $stmt = $conn->prepare(
            "SELECT id, name
               FROM subcategories
              WHERE category_id = ?
           ORDER BY name ASC"
        );
        $stmt->bind_param("i", $catId);
        $stmt->execute();
        $result = $stmt->get_result();

        $subs = [];
        while ($row = $result->fetch_assoc()) {
            $subs[] = $row;
        }
        $stmt->close();

        \View\Response::json(["subcategories" => $subs], 200);
    } else {
        \View\Response::json(["subcategories" => []], 200);
    }
    exit;
} elseif ($action === 'delete_session') {
    $data = json_decode(file_get_contents("php://input"), true);
    if (empty($data['session_id']) || !$userId) {
        Response::json(['message' => 'Invalid'], 400);
    }
    $stmt = $conn->prepare("DELETE FROM game_sessions WHERE id = ? AND user_id = ?");
    $stmt->bind_param("ii", $data['session_id'], $userId);
    $stmt->execute();
    Response::json(['message' => 'Deleted'], 200);
    exit;
}
// Remove profile picture
elseif ($action === 'remove_profile_pic') {
    if (!$userId) {
        \View\Response::json(["message" => "Unauthorized"], 401);
    }
    $stmt = $conn->prepare("UPDATE users SET profile_pic = NULL WHERE id = ?");
    $stmt->bind_param("i", $userId);
    if ($stmt->execute()) {
        \View\Response::json(["message" => "Profile picture removed"], 200);
    } else {
        \View\Response::json(["message" => "Failed to remove profile picture"], 500);
    }
    exit;
}










//ADMIN ENDPOINTS

elseif ($action === 'get_admin_stats') {
    require_once 'Model/User.php';
    $userModel = new \Model\User($conn);
    $adminUser = $userModel->getById($userId);
    if (!$adminUser || $adminUser['role'] !== 'admin') {
        \View\Response::json(["message" => "Forbidden: Admins only"], 403);
    }
    $stmt = $conn->prepare("SELECT (SELECT COUNT(*) FROM users) AS userCount, (SELECT COUNT(*) FROM user_quizzes) AS quizCount, (SELECT COUNT(*) FROM questions) AS questionCount");
    $stmt->execute();
    $result = $stmt->get_result();
    $stats = $result->fetch_assoc();
    $stmt->close();
    \View\Response::json(["stats" => $stats], 200);
} elseif ($action === 'get_all_questions') {
    require_once 'Model/User.php';
    $userModel = new \Model\User($conn);
    $adminUser = $userModel->getById($userId);
    if (!$adminUser || $adminUser['role'] !== 'admin') {
        \View\Response::json(["message" => "Forbidden: Admins only"], 403);
    }
    $stmt = $conn->prepare("
    SELECT
      q.id,
      q.question,
      q.option_a,
      q.option_b,
      q.option_c,
      q.option_d,
      q.correct_option,
      c.name           AS category_name,
      u.username       AS creator_username,
      GROUP_CONCAT(
        DISTINCT CONCAT(uq.quiz_id,':', quiz.name)
        ORDER BY quiz.name
        SEPARATOR ', '
      )                AS quiz_names,
      q.difficulty
    FROM questions q
    JOIN categories c            ON q.category_id = c.id
    JOIN users u                 ON q.user_id     = u.id
    LEFT JOIN user_quiz_questions uq ON q.id      = uq.question_id
    LEFT JOIN user_quizzes quiz      ON uq.quiz_id = quiz.id
    GROUP BY q.id
    ORDER BY q.created_at DESC
  ");
    $stmt->execute();
    $result = $stmt->get_result();
    $questions = [];
    while ($row = $result->fetch_assoc()) {
        $questions[] = $row;
    }
    $stmt->close();
    \View\Response::json(['questions' => $questions], 200);
    exit;
} elseif ($action === 'delete_question') {
    require_once 'Model/User.php';
    $userModel = new \Model\User($conn);
    $adminUser = $userModel->getById($userId);
    if (!$adminUser || $adminUser['role'] !== 'admin') {
        \View\Response::json(["message" => "Forbidden: Admins only"], 403);
    }
    $data = json_decode(file_get_contents("php://input"), true);
    $questionId = isset($data['question_id']) ? intval($data['question_id']) : 0;
    if (!$questionId) {
        \View\Response::json(["message" => "Invalid question id"], 400);
    }
    $stmt = $conn->prepare("DELETE FROM questions WHERE id = ?");
    $stmt->bind_param("i", $questionId);
    if ($stmt->execute()) {
        $stmt->close();
        \View\Response::json(["message" => "Question deleted successfully"], 200);
    } else {
        $stmt->close();
        \View\Response::json(["message" => "Failed to delete question"], 500);
    }
} elseif ($action === 'update_question') {
    require_once 'Model/User.php';
    $userModel = new \Model\User($conn);
    $adminUser = $userModel->getById($userId);
    if (!$adminUser || $adminUser['role'] !== 'admin') {
        \View\Response::json(["message" => "Forbidden: Admins only"], 403);
    }
    $data = json_decode(file_get_contents("php://input"), true);
    $questionId = isset($data['question_id']) ? intval($data['question_id']) : 0;
    $questionText = isset($data['question']) ? trim($data['question']) : "";
    $optionA = isset($data['option_a']) ? trim($data['option_a']) : "";
    $optionB = isset($data['option_b']) ? trim($data['option_b']) : "";
    $optionC = isset($data['option_c']) ? trim($data['option_c']) : "";
    $optionD = isset($data['option_d']) ? trim($data['option_d']) : "";
    $correctOption = isset($data['correct_option']) ? strtoupper(trim($data['correct_option'])) : "";
    if (!$questionId || empty($questionText) || empty($optionA) || empty($optionB) || empty($optionC) || empty($optionD) || !in_array($correctOption, ['A', 'B', 'C', 'D'])) {
        \View\Response::json(["message" => "Invalid input for updating question"], 400);
    }
    $stmt = $conn->prepare("UPDATE questions SET question = ?, option_a = ?, option_b = ?, option_c = ?, option_d = ?, correct_option = ? WHERE id = ?");
    $stmt->bind_param("ssssssi", $questionText, $optionA, $optionB, $optionC, $optionD, $correctOption, $questionId);
    if ($stmt->execute()) {
        $stmt->close();
        \View\Response::json(["message" => "Question updated successfully"], 200);
    } else {
        $stmt->close();
        \View\Response::json(["message" => "Failed to update question"], 500);
    }
} elseif ($action === 'get_all_quizzes') {
    require_once 'Model/User.php';
    $userModel = new \Model\User($conn);
    $adminUser = $userModel->getById($userId);
    if (!$adminUser || $adminUser['role'] !== 'admin') {
        \View\Response::json(["message" => "Forbidden: Admins only"], 403);
    }
    $stmt = $conn->prepare("SELECT q.id, q.name, q.description, q.is_public, q.created_at, u.username AS creator FROM user_quizzes q JOIN users u ON q.user_id = u.id ORDER BY q.created_at DESC");
    $stmt->execute();
    $result = $stmt->get_result();
    $quizzes = [];
    while ($row = $result->fetch_assoc()) {
        $quizzes[] = $row;
    }
    $stmt->close();
    \View\Response::json(["quizzes" => $quizzes], 200);
} elseif ($action === 'admin_delete_quiz') {
    require_once 'Model/User.php';
    $userModel   = new \Model\User($conn);
    $adminUser   = $userModel->getById($userId);
    if (!$adminUser || $adminUser['role'] !== 'admin') {
        \View\Response::json(["message" => "Forbidden: Admins only"], 403);
    }

    //get quiz_id and validate
    $data   = json_decode(file_get_contents("php://input"), true);
    $quizId = isset($data['quiz_id']) ? intval($data['quiz_id']) : 0;
    if (!$quizId) {
        \View\Response::json(["message" => "Invalid quiz id"], 400);
    }

    //fetch all question IDs linked to this quiz
    $stmt = $conn->prepare("
        SELECT question_id
          FROM user_quiz_questions
         WHERE quiz_id = ?
    ");
    $stmt->bind_param("i", $quizId);
    $stmt->execute();
    $result = $stmt->get_result();
    $questionIds = [];
    while ($row = $result->fetch_assoc()) {
        $questionIds[] = (int)$row['question_id'];
    }
    $stmt->close();

    //delete the quiz itself
    $stmt = $conn->prepare("
        DELETE FROM user_quizzes
         WHERE id = ?
    ");
    $stmt->bind_param("i", $quizId);

    if ($stmt->execute()) {
        $stmt->close();

        //delete all those questions in one go
        if (!empty($questionIds)) {
            //build a placeholder string like "?, ?, ?"
            $placeholders = implode(",", array_fill(0, count($questionIds), "?"));
            $types        = str_repeat("i", count($questionIds));
            $sql          = "DELETE FROM questions WHERE id IN ($placeholders)";
            $delStmt      = $conn->prepare($sql);
            //bind all IDs dynamically
            $delStmt->bind_param($types, ...$questionIds);
            $delStmt->execute();
            $delStmt->close();
        }

        \View\Response::json(["message" => "Quiz and its questions deleted"], 200);
    } else {
        $stmt->close();
        \View\Response::json(["message" => "Failed to delete quiz"], 500);
    }
} elseif ($action === 'update_quiz') {
    require_once 'Model/User.php';
    $userModel = new \Model\User($conn);
    $adminUser = $userModel->getById($userId);
    if (!$adminUser || $adminUser['role'] !== 'admin') {
        \View\Response::json(["message" => "Forbidden: Admins only"], 403);
    }
    $data = json_decode(file_get_contents("php://input"), true);
    $quizId = isset($data['quiz_id']) ? intval($data['quiz_id']) : 0;
    $name = isset($data['name']) ? trim($data['name']) : "";
    $description = isset($data['description']) ? trim($data['description']) : "";
    $isPublic = isset($data['is_public']) ? intval($data['is_public']) : 0;
    if (!$quizId || empty($name)) {
        \View\Response::json(["message" => "Invalid input for updating quiz"], 400);
    }
    $stmt = $conn->prepare("UPDATE user_quizzes SET name = ?, description = ?, is_public = ? WHERE id = ?");
    $stmt->bind_param("ssii", $name, $description, $isPublic, $quizId);
    if ($stmt->execute()) {
        $stmt->close();
        \View\Response::json(["message" => "Quiz updated successfully"], 200);
    } else {
        $stmt->close();
        \View\Response::json(["message" => "Failed to update quiz"], 500);
    }
} elseif ($action === 'admin_create_quiz') {
    require_once 'Model/User.php';
    $userModel = new \Model\User($conn);
    $adminUser = $userModel->getById($userId);
    if (!$adminUser || $adminUser['role'] !== 'admin') {
        \View\Response::json(["message" => "Forbidden: Admins only"], 403);
    }
    $data = json_decode(file_get_contents("php://input"), true);
    $name = isset($data['name']) ? trim($data['name']) : "";
    $description = isset($data['description']) ? trim($data['description']) : "";
    $isPublic = isset($data['is_public']) ? intval($data['is_public']) : 1;
    if (empty($name)) {
        \View\Response::json(["message" => "Quiz name is required"], 400);
    }
    $stmt = $conn->prepare("INSERT INTO user_quizzes (user_id, name, description, is_public, created_at) VALUES (?, ?, ?, ?, NOW())");
    $stmt->bind_param("issi", $userId, $name, $description, $isPublic);
    if ($stmt->execute()) {
        $quizId = $stmt->insert_id;
        $stmt->close();
        \View\Response::json(["message" => "Quiz created successfully", "quiz_id" => $quizId], 201);
    } else {
        $stmt->close();
        \View\Response::json(["message" => "Failed to create quiz"], 500);
    }
} elseif ($action === 'get_all_users') {
    require_once 'Model/User.php';
    $userModel = new \Model\User($conn);
    $adminUser = $userModel->getById($userId);
    if (!$adminUser || $adminUser['role'] !== 'admin') {
        \View\Response::json(["message" => "Forbidden: Admins only"], 403);
    }
    $stmt = $conn->prepare("SELECT id, username, email, role, display_name, created_at FROM users ORDER BY created_at DESC");
    $stmt->execute();
    $result = $stmt->get_result();
    $users = [];
    while ($row = $result->fetch_assoc()) {
        $users[] = $row;
    }
    $stmt->close();
    \View\Response::json(["users" => $users], 200);
} elseif ($action === 'delete_user') {
    require_once 'Model/User.php';
    $userModel = new \Model\User($conn);
    $adminUser = $userModel->getById($userId);
    if (!$adminUser || $adminUser['role'] !== 'admin') {
        \View\Response::json(["message" => "Forbidden: Admins only"], 403);
    }
    $data = json_decode(file_get_contents("php://input"), true);
    $deleteUserId = isset($data['user_id']) ? intval($data['user_id']) : 0;
    if (!$deleteUserId) {
        \View\Response::json(["message" => "Invalid user id"], 400);
    }
    $stmt = $conn->prepare("DELETE FROM users WHERE id = ?");
    $stmt->bind_param("i", $deleteUserId);
    if ($stmt->execute()) {
        $stmt->close();
        \View\Response::json(["message" => "User deleted successfully"], 200);
    } else {
        $stmt->close();
        \View\Response::json(["message" => "Failed to delete user"], 500);
    }
} elseif ($action === 'update_user') {
    require_once 'Model/User.php';
    $userModel = new \Model\User($conn);
    $adminUser = $userModel->getById($userId);
    if (!$adminUser || $adminUser['role'] !== 'admin') {
        \View\Response::json(["message" => "Forbidden: Admins only"], 403);
    }
    $data = json_decode(file_get_contents("php://input"), true);
    $editUserId = isset($data['user_id']) ? intval($data['user_id']) : 0;
    $username = isset($data['username']) ? trim($data['username']) : "";
    $email = isset($data['email']) ? trim($data['email']) : "";
    $role = isset($data['role']) ? trim($data['role']) : "";
    if (!$editUserId || empty($username) || empty($email) || !in_array($role, ['user', 'admin'])) {
        \View\Response::json(["message" => "Invalid input for updating user"], 400);
    }
    $stmt = $conn->prepare("UPDATE users SET username = ?, email = ?, role = ? WHERE id = ?");
    $stmt->bind_param("sssi", $username, $email, $role, $editUserId);
    if ($stmt->execute()) {
        $stmt->close();
        \View\Response::json(["message" => "User updated successfully"], 200);
    } else {
        $stmt->close();
        \View\Response::json(["message" => "Failed to update user"], 500);
    }
} elseif ($action === 'get_categories') {
    $stmt = $conn->prepare("SELECT id, name FROM categories ORDER BY name ASC");
    $stmt->execute();
    $result = $stmt->get_result();
    $categories = [];
    while ($row = $result->fetch_assoc()) {
        $categories[] = $row;
    }
    $stmt->close();
    \View\Response::json(["categories" => $categories], 200);
}
