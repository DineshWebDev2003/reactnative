<?php
require_once 'db.php';
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");

// Get POST data
$data = json_decode(file_get_contents('php://input'), true);
$email = isset($data['email']) ? trim($data['email']) : '';

if (!$email) {
    echo json_encode(["success" => false, "message" => "Email is required."]);
    exit;
}

// Option 1: Log the request to a file for the Founder
$logFile = __DIR__ . '/forgot_password_requests.log';
$logEntry = date('Y-m-d H:i:s') . " | Forgot password request for: $email\n";
file_put_contents($logFile, $logEntry, FILE_APPEND);

// Option 2: You could also insert into a database table or send an email to the Founder here
// Example: mail('founder@example.com', 'Forgot Password Request', "User with email $email requested a password reset.");

// Respond to the app
echo json_encode(["success" => true, "message" => "Request sent to Founder."]); 