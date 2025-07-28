<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");

include 'db.php';

$id = isset($_GET['id']) ? intval($_GET['id']) : 0;
$role = isset($_GET['role']) ? $_GET['role'] : '';

if ($id > 0) {
    $stmt = $pdo->prepare("SELECT * FROM users WHERE id = ?");
    $stmt->execute([$id]);
    $users = $stmt->fetchAll();
} elseif ($role) {
    $stmt = $pdo->prepare("SELECT * FROM users WHERE role = ?");
    $stmt->execute([$role]);
    $users = $stmt->fetchAll();
} else {
    $stmt = $pdo->query("SELECT * FROM users");
    $users = $stmt->fetchAll();
}

echo json_encode(["success" => true, "users" => $users]);
?> 