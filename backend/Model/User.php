<?php
//Backend/Model/User.php
namespace Model;

class User
{
    private $conn;

    //constructor: accepts a database connection object.
    public function __construct($conn)
    {
        $this->conn = $conn;
    }

    //find user by email.
    public function findByEmail($email)
    {
        $stmt = $this->conn->prepare("SELECT id, username, email, password, role FROM users WHERE email = ? LIMIT 1");
        $stmt->bind_param("s", $email);
        $stmt->execute();
        $result = $stmt->get_result();
        $user = $result->fetch_assoc();
        $stmt->close();
        return $user;
    }

    //register a new user. Hashes the password and inserts a record.
    public function register($username, $email, $password)
    {
        $hashedPassword = password_hash($password, PASSWORD_BCRYPT);
        $stmt = $this->conn->prepare("INSERT INTO users (username, email, password) VALUES (?, ?, ?)");
        $stmt->bind_param("sss", $username, $email, $hashedPassword);
        $result = $stmt->execute();
        $stmt->close();
        return $result;
    }

    public function getById($id)
    {
        $stmt = $this->conn->prepare("SELECT id, username, email, role, display_name, bio, profile_pic, created_at FROM users WHERE id = ? LIMIT 1");
        $stmt->bind_param("i", $id);
        $stmt->execute();
        $result = $stmt->get_result();
        $user = $result->fetch_assoc();
        $stmt->close();
        return $user;
    }
}
