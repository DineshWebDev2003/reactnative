<?php
require_once 'db.php';

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['success' => false, 'message' => 'Invalid request method']);
    exit;
}

$kid_id = isset($_POST['kid_id']) ? intval($_POST['kid_id']) : 0;
$branch = isset($_POST['branch']) ? $_POST['branch'] : '';
$frame = isset($_POST['frame']) ? $_POST['frame'] : '';

if (!$kid_id || !$branch || !isset($_FILES['image'])) {
    echo json_encode(['success' => false, 'message' => 'Missing required fields']);
    exit;
}

// Handle image upload
$target_dir = 'uploads/activities/';
if (!is_dir($target_dir)) {
    mkdir($target_dir, 0777, true);
}
$filename = 'activity_' . time() . '_' . rand(1000,9999) . '.jpg';
$target_file = $target_dir . $filename;

if (!move_uploaded_file($_FILES['image']['tmp_name'], $target_file)) {
    echo json_encode(['success' => false, 'message' => 'Failed to upload image']);
    exit;
}

// Insert into activities table
try {
    $stmt = $pdo->prepare("INSERT INTO activities (kid_id, branch, frame, image_path, created_at) VALUES (?, ?, ?, ?, NOW())");
    $stmt->execute([$kid_id, $branch, $frame, $target_file]);
    echo json_encode(['success' => true, 'message' => 'Activity posted']);
} catch (Exception $e) {
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
} 