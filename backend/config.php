<?php
// config.php

// Autoload dependencies, if not already autoloaded
require_once __DIR__ . '/vendor/autoload.php';

// Create a Dotenv instance pointing to the current directory and load the environment variables.
$dotenv = Dotenv\Dotenv::createImmutable(__DIR__);
$dotenv->load();

// Retrieve your secret key and the OpenAI API key from the environment.
$secretKey   = $_ENV['SECRET_KEY'];
$openaiApiKey = $_ENV['OPENAI_API_KEY'];
?>
