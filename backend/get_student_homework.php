<?php
include 'db.php';
header('Content-Type: application/json');

$student_id = $_GET['student_id'] ?? $_POST['student_id'] ?? null;
if (!$student_id) {
    echo json_encode(['success' => false, 'message' => 'Missing student_id']);
    exit;
}
try {
    $stmt = $pdo->prepare("SELECT h.*, u.name as teacher_name FROM homework h JOIN users u ON h.teacher_id = u.id WHERE h.student_id = ? ORDER BY h.date DESC, h.id DESC");
    $stmt->execute([$student_id]);
    $homeworks = $stmt->fetchAll();
    echo json_encode(['success' => true, 'homeworks' => $homeworks]);
} catch (PDOException $e) {
    echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
} 