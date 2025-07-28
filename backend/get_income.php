<?php
require_once 'db.php';
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");

$branch = isset($_GET['branch']) ? $_GET['branch'] : '';
$role = isset($_GET['role']) ? $_GET['role'] : '';

$where = [];
$params = [];
if ($branch) { $where[] = "branch=?"; $params[] = $branch; }
if ($role) { $where[] = "role=?"; $params[] = $role; }
$whereSql = $where ? ("WHERE " . implode(" AND ", $where)) : "";

try {
    $sql = "SELECT * FROM income_expense $whereSql ORDER BY date DESC";
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $records = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo json_encode(["success" => true, "records" => $records]);
} catch (PDOException $e) {
    echo json_encode(["success" => false, "message" => $e->getMessage()]);
}
?> 