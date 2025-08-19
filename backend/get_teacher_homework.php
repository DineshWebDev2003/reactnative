<?php
include 'db.php';
header('Content-Type: application/json');

$teacher_id = $_GET['teacher_id'] ?? $_POST['teacher_id'] ?? null;
if (!$teacher_id) {
    echo json_encode(['success' => false, 'message' => 'Missing teacher_id']);
    exit;
}
try {
    $stmt = $pdo->prepare("SELECT h.*, u.name as student_name FROM homework h JOIN users u ON h.student_id = u.id WHERE h.teacher_id = ? ORDER BY h.date DESC, h.id DESC");
    $stmt->execute([$teacher_id]);
    $homeworks = $stmt->fetchAll();
    echo json_encode(['success' => true, 'homeworks' => $homeworks]);
} catch (PDOException $e) {
    echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
} 