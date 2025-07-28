<?php
$file = $_POST['file'] ?? '';
$title = $_POST['title'] ?? '';
$version = $_POST['version'] ?? '';
$description = $_POST['description'] ?? '';
$changelog = $_POST['changelog'] ?? '';
$dir = __DIR__ . '/uploads/app_versions/';
$path = realpath($dir . $file);
if (!$file || !$path || strpos($path, realpath($dir)) !== 0 || !is_file($path)) {
    echo json_encode(['success' => false, 'message' => 'Invalid file']);
    exit;
}
$info = [
    'title' => $title,
    'version' => $version,
    'description' => $description,
    'changelog' => $changelog,
    'file' => 'uploads/app_versions/' . $file,
    'uploaded_at' => date('c', filemtime($path))
];
file_put_contents($dir . 'latest_version.json', json_encode($info));
echo json_encode(['success' => true]); 