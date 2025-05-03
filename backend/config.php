<?php
// config.php

require_once __DIR__ . '/vendor/autoload.php';

$dotenv = Dotenv\Dotenv::createImmutable(__DIR__);
$dotenv->load();

$secretKey   = $_ENV['SECRET_KEY'];
$openaiApiKey = $_ENV['OPENAI_API_KEY'];
?>
