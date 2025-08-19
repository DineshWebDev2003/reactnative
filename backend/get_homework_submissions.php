<?php
include 'db.php';
header('Content-Type: application/json');

$homework_id = $_GET['homework_id'] ?? $_POST['homework_id'] ?? null;
if (!$homework_id) {
    echo json_encode(['success' => false, 'message' => 'Missing homework_id']);
    exit;
}
try {
    $stmt = $pdo->prepare("SELECT s.*, u.name as student_name FROM homework_submissions s JOIN users u ON s.student_id = u.id WHERE s.homework_id = ? ORDER BY s.submitted_at DESC, s.id DESC");
    $stmt->execute([$homework_id]);
    $submissions = $stmt->fetchAll();
    echo json_encode(['success' => true, 'submissions' => $submissions]);
} catch (PDOException $e) {
    echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
} 