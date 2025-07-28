<?php
require_once 'db.php';
header('Content-Type: application/json');

// Accept both teacher_id and teacherId
$teacher_id = $_GET['teacher_id'] ?? $_GET['teacherId'] ?? null;
if (!$teacher_id) {
    echo json_encode(['success' => false, 'message' => 'Missing teacher_id']);
    exit;
}

// Get teacher's branch
$stmt = $pdo->prepare("SELECT branch FROM users WHERE id = ? AND (role = 'Teacher' OR role = 'Staff')");
$stmt->execute([$teacher_id]);
$row = $stmt->fetch();

if ($row) {
    $branch = $row['branch'];
    $stmt2 = $pdo->prepare("SELECT id, name, role, childName, childClass, student_id FROM users WHERE branch = ? AND role = 'Parent'");
    $stmt2->execute([$branch]);
    $students = $stmt2->fetchAll();
    echo json_encode(['success' => true, 'students' => $students]);
} else {
    echo json_encode(['success' => false, 'message' => 'Teacher not found']);
}
?> 