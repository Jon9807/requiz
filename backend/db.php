<?php
// db.php

$host     = "127.0.0.1";
$port     = 3307;
$user     = "ngun";
$pass     = "password";
$dbname   = "quiz_db";

$conn = new mysqli($host, $user, $pass, $dbname, $port);

if ($conn->connect_error) {
    die(json_encode(["error" => "Connection failed: " . $conn->connect_error]));
}
?>

