<?php
include 'db.php';
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['success' => false, 'message' => 'Invalid request method']);
    exit;
}

$teacher_id = $_POST['teacher_id'] ?? null;
$student_id = $_POST['student_id'] ?? null;
$title = $_POST['title'] ?? '';
$description = $_POST['description'] ?? '';
$date = $_POST['date'] ?? date('Y-m-d');
$file_path = null;

// Handle file upload if present
if (isset($_FILES['file']) && $_FILES['file']['error'] === UPLOAD_ERR_OK) {
    $uploadDir = 'uploads/homework/';
    if (!is_dir($uploadDir)) {
        mkdir($uploadDir, 0777, true);
    }
    $fileName = 'hw_' . time() . '_' . rand(1000,9999) . '_' . basename($_FILES['file']['name']);
    $targetPath = $uploadDir . $fileName;
    if (move_uploaded_file($_FILES['file']['tmp_name'], $targetPath)) {
        $file_path = $targetPath;
    } else {
        echo json_encode(['success' => false, 'message' => 'File upload failed']);
        exit;
    }
}

if (!$teacher_id || !$student_id || !$title) {
    echo json_encode(['success' => false, 'message' => 'Missing required fields']);
    exit;
}

try {
    $stmt = $pdo->prepare("INSERT INTO homework (student_id, teacher_id, date, title, description, file_path, status) VALUES (?, ?, ?, ?, ?, ?, 'assigned')");
    $stmt->execute([$student_id, $teacher_id, $date, $title, $description, $file_path]);
    echo json_encode(['success' => true, 'message' => 'Homework assigned successfully']);
} catch (PDOException $e) {
    echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
} 