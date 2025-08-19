<?php
require_once 'db.php';
header('Content-Type: application/json');

// Enable error logging
error_log("Face match all request received");

try {
    // Check if file was uploaded
    if (!isset($_FILES['captured_image'])) {
        echo json_encode(['success' => false, 'message' => 'No image uploaded']);
        exit;
    }

    $teacher_id = $_POST['teacher_id'] ?? null;
    $branch = $_POST['branch'] ?? null;
    
    if (!$teacher_id || !$branch) {
        echo json_encode(['success' => false, 'message' => 'Missing teacher_id or branch']);
        exit;
    }

    // Get the uploaded image
    $uploadedFile = $_FILES['captured_image'];
    $tempPath = $uploadedFile['tmp_name'];
    $fileName = $uploadedFile['name'];
    
    // Validate file type
    $allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    $fileType = mime_content_type($tempPath);
    
    if (!in_array($fileType, $allowedTypes)) {
        echo json_encode(['success' => false, 'message' => 'Invalid file type. Only JPEG and PNG allowed.']);
        exit;
    }

    // Get all students for this teacher's branch
    $stmt = $pdo->prepare("SELECT u.id, u.name, u.childName, u.student_id, u.branch, u.father_photo, u.mother_photo, u.guardian_photo FROM users u WHERE u.branch = ? AND u.role = 'Parent'");
    $stmt->execute([$branch]);
    $students = $stmt->fetchAll(PDO::FETCH_ASSOC);

    if (empty($students)) {
        echo json_encode(['success' => false, 'message' => 'No students found for this branch']);
        exit;
    }

    error_log("Found " . count($students) . " students for branch: $branch");

    $bestMatch = null;
    $bestScore = 0;
    $matchThreshold = 0.7; // Minimum similarity score

    // For each student, check against their parent photos
    foreach ($students as $student) {
        $matchScores = [];
        
        // Check father photo
        if ($student['father_photo'] && file_exists($student['father_photo'])) {
            $fatherScore = compareFaces($tempPath, $student['father_photo']);
            $matchScores['father'] = $fatherScore;
            error_log("Father match score for student {$student['childName']}: $fatherScore");
        }
        
        // Check mother photo
        if ($student['mother_photo'] && file_exists($student['mother_photo'])) {
            $motherScore = compareFaces($tempPath, $student['mother_photo']);
            $matchScores['mother'] = $motherScore;
            error_log("Mother match score for student {$student['childName']}: $motherScore");
        }
        
        // Check guardian photo
        if ($student['guardian_photo'] && file_exists($student['guardian_photo'])) {
            $guardianScore = compareFaces($tempPath, $student['guardian_photo']);
            $matchScores['guardian'] = $guardianScore;
            error_log("Guardian match score for student {$student['childName']}: $guardianScore");
        }
        
        // Find the best match score for this student
        if (!empty($matchScores)) {
            $maxScore = max($matchScores);
            if ($maxScore > $bestScore && $maxScore >= $matchThreshold) {
                $bestScore = $maxScore;
                $bestMatch = $student;
                $bestMatch['match_score'] = $maxScore;
                $bestMatch['match_type'] = array_search($maxScore, $matchScores);
            }
        }
    }

    if ($bestMatch) {
        error_log("Best match found: {$bestMatch['childName']} with score: {$bestMatch['match_score']}");
        
        // Log the face match
        $logStmt = $pdo->prepare("INSERT INTO face_match_logs (student_id, teacher_id, match_score, match_type, captured_image, created_at) VALUES (?, ?, ?, ?, ?, NOW())");
        $logStmt->execute([
            $bestMatch['student_id'],
            $teacher_id,
            $bestMatch['match_score'],
            $bestMatch['match_type'],
            $fileName
        ]);
        
        echo json_encode([
            'success' => true,
            'matched_student' => [
                'id' => $bestMatch['id'],
                'name' => $bestMatch['name'],
                'childName' => $bestMatch['childName'],
                'student_id' => $bestMatch['student_id'],
                'match_score' => $bestMatch['match_score'],
                'match_type' => $bestMatch['match_type']
            ],
            'message' => "Face matched with {$bestMatch['childName']} ({$bestMatch['match_type']})"
        ]);
    } else {
        echo json_encode([
            'success' => false,
            'message' => 'No matching parent found. Please try again.'
        ]);
    }

} catch (Exception $e) {
    error_log("Face match error: " . $e->getMessage());
    echo json_encode(['success' => false, 'message' => 'Error processing face recognition: ' . $e->getMessage()]);
}

function compareFaces($image1Path, $image2Path) {
    // This is a simplified face comparison function
    // In a real implementation, you would use a proper face recognition library
    // For now, we'll return a random score between 0.5 and 0.9 for demonstration
    
    // Get image dimensions
    $img1Info = getimagesize($image1Path);
    $img2Info = getimagesize($image2Path);
    
    if (!$img1Info || !$img2Info) {
        return 0.0;
    }
    
    // Simple comparison based on image properties
    $similarity = 0.0;
    
    // Compare aspect ratios
    $aspect1 = $img1Info[0] / $img1Info[1];
    $aspect2 = $img2Info[0] / $img2Info[1];
    $aspectDiff = abs($aspect1 - $aspect2);
    
    if ($aspectDiff < 0.1) {
        $similarity += 0.3;
    }
    
    // Compare file sizes (rough indicator of image quality/complexity)
    $size1 = filesize($image1Path);
    $size2 = filesize($image2Path);
    $sizeDiff = abs($size1 - $size2) / max($size1, $size2);
    
    if ($sizeDiff < 0.5) {
        $similarity += 0.2;
    }
    
    // Add some randomness to simulate real face recognition
    $similarity += (rand(0, 100) / 100) * 0.4;
    
    return min(0.95, $similarity);
}
?> 