<?php
require_once 'db.php';
header('Content-Type: application/json');

$branch = isset($_GET['branch']) ? $_GET['branch'] : '';
$group_by = isset($_GET['group_by']) ? $_GET['group_by'] : '';
$month = isset($_GET['month']) ? intval($_GET['month']) : 0;
$year = isset($_GET['year']) ? intval($_GET['year']) : 0;

try {
    $params = [];
    $where = [];
    if ($branch !== '') {
        $where[] = 'branch = ?';
        $params[] = $branch;
    }
    if ($month > 0) {
        $where[] = 'MONTH(date) = ?';
        $params[] = $month;
    }
    if ($year > 0) {
        $where[] = 'YEAR(date) = ?';
        $params[] = $year;
    }
    $whereSql = $where ? ('WHERE ' . implode(' AND ', $where)) : '';

    if ($group_by === 'month') {
        $sql = "SELECT YEAR(date) as year, MONTH(date) as month, 
                       SUM(CASE WHEN type='income' THEN amount ELSE 0 END) as total_income, 
                       SUM(CASE WHEN type='expense' THEN amount ELSE 0 END) as total_expense
                FROM income_expense 
                $whereSql
                GROUP BY year, month
                ORDER BY year ASC, month ASC";
    } else {
        $sql = "SELECT DATE(date) as day, 
                       SUM(CASE WHEN type='income' THEN amount ELSE 0 END) as total_income, 
                       SUM(CASE WHEN type='expense' THEN amount ELSE 0 END) as total_expense
                FROM income_expense 
                $whereSql
                GROUP BY day
                ORDER BY day ASC";
    }
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $trend = $stmt->fetchAll();
    echo json_encode(['success' => true, 'trend' => $trend]);
} catch (Exception $e) {
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
?> 