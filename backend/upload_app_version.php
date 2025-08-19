<?php
// backend/upload_app_version.php
require_once 'db.php'; // adjust if needed

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With');

$title = $_POST['title'] ?? '';
$version = $_POST['version'] ?? '';
$description = $_POST['description'] ?? '';
$changelog = $_POST['changelog'] ?? '';

if (!isset($_FILES['file']) || !$title || !$version) {
    echo json_encode(['success' => false, 'message' => 'Missing required fields or file']);
    exit;
}

$uploadDir = __DIR__ . '/uploads/app_versions/';
if (!is_dir($uploadDir)) mkdir($uploadDir, 0777, true);

$filename = basename($_FILES['file']['name']);
$targetFile = $uploadDir . $filename;

if (move_uploaded_file($_FILES['file']['tmp_name'], $targetFile)) {
    // Save version info (could be a DB insert, here as JSON for demo)
    $info = [
        'title' => $title,
        'version' => $version,
        'description' => $description,
        'changelog' => $changelog,
        'file' => 'uploads/app_versions/' . $filename,
        'uploaded_at' => date('c')
    ];
    file_put_contents($uploadDir . 'latest_version.json', json_encode($info));
    echo json_encode(['success' => true]);
} else {
    echo json_encode(['success' => false, 'message' => 'File upload failed']);
} 