<?php
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Headers: *');
header('Content-Type: application/json');

require_once __DIR__ . '/../backend/db.php';

try {
    $stmt = $pdo->prepare("SELECT id, name, email FROM users WHERE role = 'administration' LIMIT 1");
    $stmt->execute();
    $administration = $stmt->fetch();

    if ($administration) {
        // Add a placeholder avatar if not present in DB
        $administration['avatar'] = 'https://ui-avatars.com/api/?name=' . urlencode($administration['name']);
        echo json_encode(["administration" => $administration]);
    } else {
        echo json_encode(["administration" => null, "error" => "Administration not found."]);
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Error fetching administration profile", "error" => $e->getMessage()]);
}
?> 