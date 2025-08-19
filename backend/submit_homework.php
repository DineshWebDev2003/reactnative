<?php
include 'db.php';
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['success' => false, 'message' => 'Invalid request method']);
    exit;
}

$homework_id = $_POST['homework_id'] ?? null;
$student_id = $_POST['student_id'] ?? null;
$file_path = null;

// Handle file upload if present
if (isset($_FILES['file']) && $_FILES['file']['error'] === UPLOAD_ERR_OK) {
    $uploadDir = 'uploads/homework_submissions/';
    if (!is_dir($uploadDir)) {
        mkdir($uploadDir, 0777, true);
    }
    $fileName = 'sub_' . time() . '_' . rand(1000,9999) . '_' . basename($_FILES['file']['name']);
    $targetPath = $uploadDir . $fileName;
    if (move_uploaded_file($_FILES['file']['tmp_name'], $targetPath)) {
        $file_path = $targetPath;
    } else {
        echo json_encode(['success' => false, 'message' => 'File upload failed']);
        exit;
    }
}

if (!$homework_id || !$student_id) {
    echo json_encode(['success' => false, 'message' => 'Missing required fields']);
    exit;
}

try {
    $stmt = $pdo->prepare("INSERT INTO homework_submissions (homework_id, student_id, file_path, submitted_at) VALUES (?, ?, ?, NOW())");
    $stmt->execute([$homework_id, $student_id, $file_path]);
    // Update homework status to 'submitted'
    $stmt2 = $pdo->prepare("UPDATE homework SET status = 'submitted' WHERE id = ?");
    $stmt2->execute([$homework_id]);
    echo json_encode(['success' => true, 'message' => 'Homework submitted successfully']);
} catch (PDOException $e) {
    echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
} 