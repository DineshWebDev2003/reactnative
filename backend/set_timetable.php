<?php
require_once 'db.php';
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With');

$data = json_decode(file_get_contents('php://input'), true);

$id = isset($data['id']) ? intval($data['id']) : null;
$day = isset($data['day']) ? $data['day'] : null;
$start = isset($data['start']) ? $data['start'] : null;
$end = isset($data['end']) ? $data['end'] : null;
$description = isset($data['description']) ? $data['description'] : null;
$branch = isset($data['branch']) ? $data['branch'] : null;
$delete = isset($data['delete']) ? boolval($data['delete']) : false;

try {
    if ($delete && $id) {
        // Delete period
        $stmt = $pdo->prepare('DELETE FROM timetable_periods WHERE id = ?');
        $stmt->execute([$id]);
        echo json_encode(['success' => true, 'message' => 'Period deleted']);
        exit;
    }
    if ($id) {
        // Edit period
        $stmt = $pdo->prepare('UPDATE timetable_periods SET day = ?, start = ?, end = ?, description = ?, branch = ? WHERE id = ?');
        $stmt->execute([$day, $start, $end, $description, $branch, $id]);
        echo json_encode(['success' => true, 'message' => 'Period updated']);
        exit;
    }
    // Add new period
    if ($day && $start && $end && $description) {
        $stmt = $pdo->prepare('INSERT INTO timetable_periods (day, start, end, description, branch) VALUES (?, ?, ?, ?, ?)');
        $stmt->execute([$day, $start, $end, $description, $branch]);
        echo json_encode(['success' => true, 'message' => 'Period added', 'id' => $pdo->lastInsertId()]);
        exit;
    }
    echo json_encode(['success' => false, 'message' => 'Missing required fields']);
} catch (PDOException $e) {
    echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
} 