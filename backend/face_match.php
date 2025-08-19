<?php
require_once 'db.php';
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

try {
    // Handle multipart form data for image upload
    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        $studentId = $_POST['student_id'] ?? null;
        $parentId = $_POST['parent_id'] ?? null;
        
        if (!$studentId || !$parentId) {
            echo json_encode(['success' => false, 'message' => 'Missing student_id or parent_id']);
            exit;
        }

        // Check if image was uploaded
        if (!isset($_FILES['captured_image']) || $_FILES['captured_image']['error'] !== UPLOAD_ERR_OK) {
            echo json_encode(['success' => false, 'message' => 'No image uploaded or upload error']);
            exit;
        }

        $capturedImage = $_FILES['captured_image'];
        
        // Get parent photos from database
        $stmt = $pdo->prepare("SELECT father_photo, mother_photo, guardian_photo FROM users WHERE id = ? AND role = 'Parent'");
        $stmt->execute([$parentId]);
        $parentData = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$parentData) {
            echo json_encode(['success' => false, 'message' => 'Parent not found']);
            exit;
        }

        // Initialize match results
        $matchResult = [
            'father' => false,
            'mother' => false,
            'guardian' => false
        ];
        $matchedParent = null;
        $confidence = 0;

        // Simple image comparison (you can replace this with actual face recognition)
        // For now, we'll simulate matching based on file size and basic checks
        
        $capturedImageSize = filesize($capturedImage['tmp_name']);
        
        // Check father photo
        if ($parentData['father_photo'] && file_exists(__DIR__ . '/' . $parentData['father_photo'])) {
            $fatherImageSize = filesize(__DIR__ . '/' . $parentData['father_photo']);
            // Simple size-based similarity (replace with actual face recognition)
            if (abs($capturedImageSize - $fatherImageSize) < 10000) {
                $matchResult['father'] = true;
                $matchedParent = 'Father';
                $confidence = 85;
            }
        }
        
        // Check mother photo
        if ($parentData['mother_photo'] && file_exists(__DIR__ . '/' . $parentData['mother_photo'])) {
            $motherImageSize = filesize(__DIR__ . '/' . $parentData['mother_photo']);
            if (abs($capturedImageSize - $motherImageSize) < 10000) {
                $matchResult['mother'] = true;
                $matchedParent = 'Mother';
                $confidence = 85;
            }
        }
        
        // Check guardian photo
        if ($parentData['guardian_photo'] && file_exists(__DIR__ . '/' . $parentData['guardian_photo'])) {
            $guardianImageSize = filesize(__DIR__ . '/' . $parentData['guardian_photo']);
            if (abs($capturedImageSize - $guardianImageSize) < 10000) {
                $matchResult['guardian'] = true;
                $matchedParent = 'Guardian';
                $confidence = 85;
            }
        }

        // Log the face matching attempt
        $logStmt = $pdo->prepare("INSERT INTO face_match_logs (student_id, parent_id, captured_image_path, match_result, matched_parent, confidence, created_at) VALUES (?, ?, ?, ?, ?, ?, NOW())");
        $logStmt->execute([
            $studentId,
            $parentId,
            $capturedImage['name'],
            json_encode($matchResult),
            $matchedParent,
            $confidence
        ]);

        echo json_encode([
            'success' => true,
            'match_result' => $matchResult,
            'matched_parent' => $matchedParent,
            'confidence' => $confidence,
            'message' => $matchedParent ? "Face matched with $matchedParent" : "No parent match found"
        ]);
        
    } else {
        echo json_encode(['success' => false, 'message' => 'Only POST method allowed']);
    }
    
} catch (Exception $e) {
    echo json_encode(['success' => false, 'message' => 'Error: ' . $e->getMessage()]);
}
?>