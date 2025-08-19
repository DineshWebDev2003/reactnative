<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

require_once 'db_connect.php';

try {
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!$input) {
        echo json_encode([
            'success' => false,
            'message' => 'Invalid input data'
        ]);
        exit;
    }

    $activity_id = $input['activity_id'] ?? null;
    $title = $input['title'] ?? '';
    $description = $input['description'] ?? '';
    $user_id = $input['user_id'] ?? null;
    $user_role = $input['user_role'] ?? null;

    if (!$activity_id) {
        echo json_encode([
            'success' => false,
            'message' => 'Activity ID is required'
        ]);
        exit;
    }

    if (!$user_id || !$user_role) {
        echo json_encode([
            'success' => false,
            'message' => 'User ID and role are required'
        ]);
        exit;
    }

    // Check if user has permission to edit (teacher, franchisee, or admin)
    $allowed_roles = ['teacher', 'franchisee', 'admin', 'Administration'];
    if (!in_array(strtolower($user_role), array_map('strtolower', $allowed_roles))) {
        echo json_encode([
            'success' => false,
            'message' => 'You do not have permission to edit activities'
        ]);
        exit;
    }

    // First get the activity to verify ownership/branch access
    $stmt = $pdo->prepare("SELECT a.*, u.branch as user_branch FROM activities a JOIN users u ON a.kid_id = u.id WHERE a.id = ?");
    $stmt->execute([$activity_id]);
    $activity = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$activity) {
        echo json_encode([
            'success' => false,
            'message' => 'Activity not found'
        ]);
        exit;
    }

    // For teachers, check if they have access to the activity's branch
    if (strtolower($user_role) === 'teacher') {
        $teacher_stmt = $pdo->prepare("SELECT branch FROM users WHERE id = ? AND role = 'teacher'");
        $teacher_stmt->execute([$user_id]);
        $teacher = $teacher_stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$teacher || $teacher['branch'] !== $activity['user_branch']) {
            echo json_encode([
                'success' => false,
                'message' => 'You can only edit activities from your branch'
            ]);
            exit;
        }
    }

    // Update the activity
    $stmt = $pdo->prepare("
        UPDATE activities 
        SET activity_text = ?, updated_at = NOW()
        WHERE id = ?
    ");
    
    $result = $stmt->execute([$description, $activity_id]);

    if ($result) {
        echo json_encode([
            'success' => true,
            'message' => 'Activity updated successfully'
        ]);
    } else {
        echo json_encode([
            'success' => false,
            'message' => 'Failed to update activity'
        ]);
    }

} catch (PDOException $e) {
    echo json_encode([
        'success' => false,
        'message' => 'Database error: ' . $e->getMessage()
    ]);
} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'message' => 'Server error: ' . $e->getMessage()
    ]);
}
?> 