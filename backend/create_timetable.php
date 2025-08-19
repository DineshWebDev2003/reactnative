<?php
require_once 'db.php';
header('Content-Type: application/json');

try {
    $data = json_decode(file_get_contents('php://input'));
    $title = $data->title ?? '';
    $description = $data->description ?? '';
    $date = $data->date ?? '';
    $time = $data->time ?? '';
    $branch = $data->branch ?? null; // null or empty for all
    $created_by = $data->created_by ?? null;

    if (!$title || !$date) {
        echo json_encode(['success' => false, 'message' => 'Missing required fields']);
        exit;
    }

    $stmt = $pdo->prepare("INSERT INTO timetable (branch, title, description, date, time, created_by) VALUES (?, ?, ?, ?, ?, ?)");
    $result = $stmt->execute([$branch, $title, $description, $date, $time, $created_by]);
    if ($result) {
        echo json_encode(['success' => true, 'id' => $pdo->lastInsertId()]);
    } else {
        echo json_encode(['success' => false, 'message' => 'Failed to create timetable']);
    }
} catch (PDOException $e) {
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
?> 