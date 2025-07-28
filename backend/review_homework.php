<?php
include 'db.php';
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['success' => false, 'message' => 'Invalid request method']);
    exit;
}

$homework_id = $_POST['homework_id'] ?? null;
$feedback = $_POST['feedback'] ?? '';
$status = $_POST['status'] ?? 'reviewed';

if (!$homework_id) {
    echo json_encode(['success' => false, 'message' => 'Missing homework_id']);
    exit;
}

try {
    $stmt = $pdo->prepare("UPDATE homework SET feedback = ?, status = ? WHERE id = ?");
    $stmt->execute([$feedback, $status, $homework_id]);
    echo json_encode(['success' => true, 'message' => 'Homework reviewed successfully']);
} catch (PDOException $e) {
    echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
} 