<?php
$dir = __DIR__ . '/uploads/app_versions/';
$files = [];
if (is_dir($dir)) {
    foreach (scandir($dir) as $file) {
        if ($file === '.' || $file === '..' || $file === 'latest_version.json') continue;
        $path = $dir . $file;
        if (is_file($path)) {
            $files[] = [
                'name' => $file,
                'size' => filesize($path),
                'modified' => date('c', filemtime($path)),
                'url' => 'uploads/app_versions/' . $file
            ];
        }
    }
}
header('Content-Type: application/json');
echo json_encode(['files' => $files]); 