<?php
//Backend/Controller/UserController.php
namespace Controller;

use Model\User;
use Firebase\JWT\JWT;

class UserController {
    private $conn;
    private $secretKey;

    //constructor accepts a database connection and the secret key.
    public function __construct($conn, $secretKey) {
        $this->conn = $conn;
        $this->secretKey = $secretKey;
    }

    //handle user registration.
    public function register($data) {
        //validate input.
        if (empty($data['username']) || empty($data['email']) || empty($data['password'])) {
            return ['status' => 400, 'message' => 'All fields are required'];
        }

        //instantiate the User model.
        $userModel = new User($this->conn);
        //check if the email is already registered.
        $existingUser = $userModel->findByEmail($data['email']);
        if ($existingUser) {
            return ['status' => 400, 'message' => 'Email already registered'];
        }

        //register the new user.
        if ($userModel->register($data['username'], $data['email'], $data['password'])) {
            return ['status' => 201, 'message' => 'User registered successfully'];
        } else {
            return ['status' => 500, 'message' => 'Failed to register user'];
        }
    }

    //handle user login.
    public function login($data) {
        //validate input.
        if (empty($data['email']) || empty($data['password'])) {
            return ['status' => 400, 'message' => 'Email and password required'];
        }

        //instantiate the User model.
        $userModel = new User($this->conn);
        //find user by email.
        $user = $userModel->findByEmail($data['email']);
        if (!$user || !password_verify($data['password'], $user['password'])) {
            return ['status' => 401, 'message' => 'Invalid credentials'];
        }

        //JWT payload.
        $payload = [
            "iss" => "http://localhost",   //issuer 
            "aud" => "http://localhost",   //audience 
            "iat" => time(),               //issued at time
            "exp" => time() + 3600,        //expiration time (1 hour)
            "user_id" => $user['id'],      //user ID from the database
            "username" => $user['username'], //username
            "role" => $user['role']        //user role
        ];

        //encode payload into a JWT using the secret key.
        $token = JWT::encode($payload, $this->secretKey, 'HS256');

        //return the JWT along with a success message.
        return ['status' => 200, 'message' => 'Login successful', 'token' => $token];
    }

    
}
