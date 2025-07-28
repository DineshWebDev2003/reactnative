<?php
$file = $_POST['file'] ?? '';
$dir = __DIR__ . '/uploads/app_versions/';
$path = realpath($dir . $file);
if (!$file || !$path || strpos($path, realpath($dir)) !== 0 || !is_file($path)) {
    echo json_encode(['success' => false, 'message' => 'Invalid file']);
    exit;
}
$deleted = unlink($path);
// If the deleted file was the latest, remove or update latest_version.json
$latestPath = $dir . 'latest_version.json';
if (is_file($latestPath)) {
    $latest = json_decode(file_get_contents($latestPath), true);
    if ($latest && isset($latest['file']) && basename($latest['file']) === $file) {
        unlink($latestPath);
    }
}
echo json_encode(['success' => $deleted]); 