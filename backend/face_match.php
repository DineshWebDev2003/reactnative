<?php
require_once 'db.php';
header('Content-Type: application/json');

$data = json_decode(file_get_contents('php://input'), true);
$studentId = $data['studentId'] ?? null;
$imageBase64 = $data['image'] ?? null;

if (!$studentId || !$imageBase64) {
    echo json_encode(['success' => false, 'message' => 'Missing data']);
    exit;
}

// TODO: Load parent images for this student from DB (e.g., father_pic, mother_pic)
// TODO: Use a face recognition library/service to compare $imageBase64 to parent images

// For now, simulate a match:
$match = true; // or false
$matchType = 'father'; // or 'mother' or 'none'

echo json_encode([
    'success' => true,
    'match' => $match,
    'matchType' => $matchType
]);