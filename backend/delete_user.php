<?php
require_once 'db.php';
header('Content-Type: application/json');

$data = json_decode(file_get_contents("php://input"));
$user_id = isset($data->user_id) ? intval($data->user_id) : 0;
$administration_password = isset($data->administration_password) ? $data->administration_password : '';

if (!$user_id || !$administration_password) {
    echo json_encode(["success" => false, "message" => "Missing user_id or administration_password"]);
    exit();
}

try {
    // Verify administration password
    $stmt = $pdo->prepare("SELECT password FROM users WHERE role='Administration' LIMIT 1");
    $stmt->execute();
    $administration = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$administration || !password_verify($administration_password, $administration['password'])) {
        echo json_encode(["success" => false, "message" => "Invalid administration password"]);
        exit();
    }
    // Delete user
    $stmt = $pdo->prepare("DELETE FROM users WHERE id=?");
    $result = $stmt->execute([$user_id]);
    if ($result) {
        echo json_encode(["success" => true]);
    } else {
        echo json_encode(["success" => false, "message" => "Failed to delete user"]);
    }
} catch (PDOException $e) {
    echo json_encode(["success" => false, "message" => $e->getMessage()]);
}
?>