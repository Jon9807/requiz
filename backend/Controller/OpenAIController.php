<?php
// backend/Controller/OpenAIController.php
namespace Controller;

use GuzzleHttp\Client;

class OpenAIController {
    private $apiKey;
    private $client;

    public function __construct($apiKey) {
        $this->apiKey = $apiKey;
        //increase timeout and allow more tokens for larger quizzes
        $this->client = new Client([
            'base_uri'        => 'https://api.openai.com/v1/',
            'timeout'         => 60.0,   // total request timeout
            'connect_timeout' => 10.0,   // connection phase timeout
            'read_timeout'    => 50.0,   // response read timeout
        ]);
    }
    public function generateQuiz(string $category, string $difficulty, int $numQuestions): array {
        $prompt = "Generate a quiz in valid JSON format. Do NOT include any markdown formatting. "
                . "Return an array with exactly {$numQuestions} question objects. Each object must have the keys: "
                . "'question' (string), 'options' (an array of 4 strings), and 'answer' (string). "
                . "The quiz topic is '{$category}' and the difficulty is '{$difficulty}'. Return only the JSON array.";

        try {
            $response = $this->client->post('chat/completions', [
                'headers' => [
                    'Content-Type'  => 'application/json',
                    'Authorization' => "Bearer {$this->apiKey}",
                ],
                'json' => [
                    'model'       => 'gpt-3.5-turbo',
                    'messages'    => [
                        ['role' => 'system',  'content' => 'You are a helpful quiz generator.'],
                        ['role' => 'user',    'content' => $prompt],
                    ],
                    //allow up to 1500 tokens so 15 questions can fit
                    'max_tokens'  => 1500,
                    'temperature' => 0.7,
                ],
            ]);

            $body = json_decode($response->getBody(), true);
            $content = trim($body['choices'][0]['message']['content'] ?? '');

            //Strip ``` markers if present
            if (strpos($content, "```") === 0) {
                $content = preg_replace('/^```(?:json)?\s*/i', '', $content);
                $content = preg_replace('/\s*```$/', '', $content);
            }

            //Extract first JSON array
            $start = strpos($content, "[");
            $end   = strrpos($content, "]");
            if ($start !== false && $end !== false) {
                $content = substr($content, $start, $end - $start + 1);
            }

            $quiz = json_decode($content, true);
            if (json_last_error() !== JSON_ERROR_NONE) {
                return ['error' => 'Invalid JSON: ' . json_last_error_msg()];
            }
            return ['status' => 200, 'quiz' => $quiz];
        } catch (\Exception $e) {
            return ['error' => $e->getMessage()];
        }
    }
}
