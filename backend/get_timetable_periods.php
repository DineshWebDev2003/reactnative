<?php
require_once 'db.php';
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

$day = isset($_GET['day']) ? $_GET['day'] : '';
$branch = isset($_GET['branch']) ? $_GET['branch'] : null;

try {
    if ($branch) {
        $stmt = $pdo->prepare('SELECT id, day, start, end, description, branch FROM timetable_periods WHERE day = ? AND (branch = ? OR branch IS NULL)');
        $stmt->execute([$day, $branch]);
    } else {
        $stmt = $pdo->prepare('SELECT id, day, start, end, description, branch FROM timetable_periods WHERE day = ?');
        $stmt->execute([$day]);
    }
    $periods = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo json_encode(['success' => true, 'periods' => $periods]);
} catch (PDOException $e) {
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}