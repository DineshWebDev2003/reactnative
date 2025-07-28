<?php
ini_set('display_errors', 1);
error_reporting(E_ALL);
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

require_once 'db.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['success' => false, 'message' => 'Only POST method allowed']);
    exit;
}

try {
    $userId = $_POST['userId'] ?? '';
    $teacherName = $_POST['teacherName'] ?? '';
    $branch = $_POST['branch'] ?? '';

    if (empty($userId) || empty($teacherName) || empty($branch)) {
        echo json_encode(['success' => false, 'message' => 'All fields are required']);
        exit;
    }

    // Handle profile picture upload
    $profilePicPath = '';
    if (isset($_FILES['profilePic']) && $_FILES['profilePic']['error'] === UPLOAD_ERR_OK) {
        $uploadDir = 'uploads/teachers/';
        if (!is_dir($uploadDir)) {
            mkdir($uploadDir, 0777, true);
        }

        $fileInfo = pathinfo($_FILES['profilePic']['name']);
        $extension = strtolower($fileInfo['extension']);
        
        // Validate file type
        $allowedTypes = ['jpg', 'jpeg', 'png'];
        if (!in_array($extension, $allowedTypes)) {
            echo json_encode(['success' => false, 'message' => 'Only JPG, JPEG, and PNG files are allowed']);
            exit;
        }

        // Generate unique filename
        $filename = 'teacher_' . $userId . '_' . time() . '.' . $extension;
        $filepath = $uploadDir . $filename;

        if (move_uploaded_file($_FILES['profilePic']['tmp_name'], $filepath)) {
            $profilePicPath = $filepath;
        } else {
            echo json_encode(['success' => false, 'message' => 'Failed to upload profile picture']);
            exit;
        }
    } else {
        $err = isset($_FILES['profilePic']) ? $_FILES['profilePic']['error'] : 'No file uploaded';
        echo json_encode(['success' => false, 'message' => 'Profile picture is required or upload failed', 'file_error' => $err, 'files' => $_FILES]);
        exit;
    }

    // Update teacher profile in database
    $stmt = $pdo->prepare("
        UPDATE users 
        SET name = ?, branch = ?, profile_pic = ?, onboarding_complete = 1 
        WHERE id = ? AND role = 'teacher'
    ");

    $result = $stmt->execute([$teacherName, $branch, $profilePicPath, $userId]);

    if ($result) {
        echo json_encode([
            'success' => true, 
            'message' => 'Teacher profile updated successfully',
            'profilePic' => $profilePicPath
        ]);
    } else {
        echo json_encode(['success' => false, 'message' => 'Failed to update teacher profile']);
    }

} catch (Exception $e) {
    echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
}
?> 