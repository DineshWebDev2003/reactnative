<?php
require_once 'db.php';
header('Content-Type: application/json');

$branch = isset($_GET['branch']) ? $_GET['branch'] : '';
$date = isset($_GET['date']) ? $_GET['date'] : '';
$staff_id = isset($_GET['staff_id']) ? intval($_GET['staff_id']) : 0;
$submitted_to = isset($_GET['submitted_to']) ? $_GET['submitted_to'] : '';

$where = [];
$params = [];

if ($branch) { $where[] = "branch = ?"; $params[] = $branch; }
if ($date) { $where[] = "date = ?"; $params[] = $date; }
if ($staff_id) { $where[] = "staff_id = ?"; $params[] = $staff_id; }
if ($submitted_to) { $where[] = "(submitted_to = ? OR submitted_to = 'both')"; $params[] = $submitted_to; }

$whereSql = $where ? ("WHERE " . implode(" AND ", $where)) : "";

try {
    $sql = "SELECT * FROM staff_attendance $whereSql ORDER BY date DESC, clock_in ASC";
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo json_encode(['success' => true, 'reports' => $rows]);
} catch (PDOException $e) {
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
} 