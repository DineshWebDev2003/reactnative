<?php
require_once 'db.php';
header('Content-Type: application/json');

$student_id = isset($_GET['student_id']) ? intval($_GET['student_id']) : 0;

if (!$student_id) {
    echo json_encode(["success" => false, "message" => "Missing or invalid student_id."]);
    exit();
}

// Example: Assume ID cards are stored as uploads/id_cards/id_card_{student_id}.jpg
$file_path = "uploads/id_cards/id_card_{$student_id}.jpg";
if (file_exists($file_path)) {
    echo json_encode(["success" => true, "file_path" => $file_path]);
} else {
    echo json_encode(["success" => false, "message" => "ID card not found."]);
} 