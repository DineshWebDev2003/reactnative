<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

include 'db.php';

$input = file_get_contents("php://input");
$data = json_decode($input);

if (!$data || !isset($data->emailOrMobile) || !isset($data->password)) {
    echo json_encode(["success" => false, "message" => "Missing or invalid input data"]);
    exit();
}

$emailOrMobile = $data->emailOrMobile;
$password = $data->password;

$stmt = $pdo->prepare("SELECT * FROM users WHERE (email = ? OR mobile = ?) LIMIT 1");
$stmt->execute([$emailOrMobile, $emailOrMobile]);
$user = $stmt->fetch();

if (!$user) {
    echo json_encode(["success" => false, "message" => "User not found"]);
    exit;
}

if (isset($user['password']) && password_verify($password, $user['password'])) {
    echo json_encode([
        "success" => true,
        "user" => [
            "id" => $user["id"],
            "name" => $user["name"],
            "role" => $user["role"],
            "branch" => $user["branch"],
            "email" => $user["email"],
            "mobile" => $user["mobile"],
            "onboarding_complete" => isset($user["onboarding_complete"]) ? (bool)$user["onboarding_complete"] : false
        ]
    ]);
} else {
    echo json_encode(["success" => false, "message" => "Invalid credentials"]);
} 