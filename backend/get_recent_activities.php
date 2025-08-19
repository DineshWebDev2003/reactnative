<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

require_once 'db.php'; // <-- Use your actual DB connection file

try {
    $branch = isset($_GET['branch']) ? $_GET['branch'] : null;

    $query = "SELECT 
                a.id,
                a.image_path,
                a.created_at,
                a.activity_name,
                a.activity_text,
                u.childName,
                u.child_photo,
                u.branch,
                u.name as parent_name
            FROM activities a
            LEFT JOIN users u ON a.user_id = u.id
            WHERE a.image_path IS NOT NULL";

    // Add branch filter if provided
    if ($branch) {
        $query .= " AND u.branch = :branch";
    }

    $query .= " ORDER BY a.created_at DESC LIMIT 50";

    $stmt = $conn->prepare($query);

    if ($branch) {
        $stmt->bindParam(':branch', $branch);
    }

    $stmt->execute();
    $activities = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Format the activities
    $formattedActivities = [];
    foreach ($activities as $activity) {
        $formattedActivities[] = [
            'id' => $activity['id'],
            'image_path' => $activity['image_path'],
            'created_at' => $activity['created_at'],
            'activity_name' => $activity['activity_name'] ?? '',
            'activity_text' => $activity['activity_text'] ?? '',
            'childName' => $activity['childName'] ?: 'Unknown Child',
            'child_photo' => $activity['child_photo'] ?? '',
            'branch' => $activity['branch'] ?: 'Unknown Branch',
            'parent_name' => $activity['parent_name'] ?: 'Unknown Parent'
        ];
    }

    echo json_encode([
        'success' => true,
        'activities' => $formattedActivities,
        'count' => count($formattedActivities)
    ]);

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