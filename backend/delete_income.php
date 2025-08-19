<?php
require_once 'db.php';
header('Content-Type: application/json');

$data = json_decode(file_get_contents('php://input'));
$id = isset($data->id) ? intval($data->id) : 0;

if (!$id) {
    echo json_encode(["success" => false, "message" => "Missing or invalid transaction ID."]);
    exit();
}

try {
    $stmt = $pdo->prepare("DELETE FROM income_expense WHERE id = ?");
    $result = $stmt->execute([$id]);
    if ($result) {
        echo json_encode(["success" => true]);
    } else {
        echo json_encode(["success" => false, "message" => "Failed to delete transaction."]);
    }
} catch (PDOException $e) {
    echo json_encode(["success" => false, "message" => $e->getMessage()]);
} 