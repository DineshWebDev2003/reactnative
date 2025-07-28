<?php
require_once 'db.php';
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");

$branch = $_GET['branch'] ?? '';

try {
    $stmt = $pdo->prepare("SELECT COUNT(*) as count FROM users WHERE branch=? AND role='Teacher'");
    $stmt->execute([$branch]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);
    echo json_encode(["success" => true, "count" => $row['count']]);
} catch (PDOException $e) {
    echo json_encode(["success" => false, "message" => $e->getMessage()]);
}
?> 