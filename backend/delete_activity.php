<?php
// Enable error reporting for debugging
ini_set('display_errors', 1);
error_reporting(E_ALL);
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

require_once 'db.php';

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
    $user_id = $input['user_id'] ?? null;
    $user_role = $input['user_role'] ?? null;

    if (!$activity_id) {
        echo json_encode([
            'success' => false,
            'message' => 'Missing activity_id'
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

    // Only admin or authorized user can delete
    $allowed_roles = ['admin', 'administration', 'teacher', 'franchisee'];
    if (!in_array(strtolower($user_role), $allowed_roles)) {
        echo json_encode([
            'success' => false,
            'message' => 'Unauthorized: Only admin, Administration, teacher, or franchisee can delete activities',
            'debug_role' => $user_role
        ]);
        exit;
    }

    // First get the activity to find the image file and verify ownership/branch access
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

    // Delete the activity from database
    $stmt = $pdo->prepare("DELETE FROM activities WHERE id = ?");
    $result = $stmt->execute([$activity_id]);

    if ($result) {
        // Delete the image file if it exists
        if ($activity && $activity['image_path']) {
            $image_path = __DIR__ . '/' . $activity['image_path'];
            if (file_exists($image_path)) {
                unlink($image_path);
            }
        }

        echo json_encode([
            'success' => true,
            'message' => 'Activity deleted successfully'
        ]);
    } else {
        echo json_encode([
            'success' => false,
            'message' => 'Failed to delete activity'
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