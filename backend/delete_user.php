<?php
require_once 'db.php';
header('Content-Type: application/json');

$data = json_decode(file_get_contents("php://input"), true);

$founder_id = isset($data['founder_id']) ? intval($data['founder_id']) : 0;
$founder_password = isset($data['founder_password']) ? $data['founder_password'] : '';
$user_id = isset($data['user_id']) ? intval($data['user_id']) : 0;

if (!$founder_id || !$founder_password || !$user_id) {
    echo json_encode(["success" => false, "message" => "Missing founder_id, founder_password, or user_id"]);
    exit();
}

try {
    // Verify founder password
    $stmt = $pdo->prepare("SELECT password FROM users WHERE id=? AND (role='Founder' OR role='Administration') LIMIT 1");
    $stmt->execute([$founder_id]);
    $founder = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$founder || !password_verify($founder_password, $founder['password'])) {
        echo json_encode(["success" => false, "message" => "Invalid founder/admin password or user"]);
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