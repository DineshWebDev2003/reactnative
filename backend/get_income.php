<?php
require_once 'db.php';
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");

$branch = isset($_GET['branch']) ? $_GET['branch'] : '';
$role = isset($_GET['role']) ? $_GET['role'] : '';
$franchisee_id = isset($_GET['franchisee_id']) ? $_GET['franchisee_id'] : '';

$where = [];
$params = [];
if ($branch) { $where[] = "branch=?"; $params[] = $branch; }
if ($role) { $where[] = "role=?"; $params[] = $role; }
if ($franchisee_id) { $where[] = "franchisee_id=?"; $params[] = $franchisee_id; }
$whereSql = $where ? ("WHERE " . implode(" AND ", $where)) : "";

try {
    $sql = "SELECT * FROM income_expense $whereSql ORDER BY date DESC";
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $records = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // --- Calculations ---
    $total_income = 0;
    $total_expenses = 0;

    foreach ($records as $record) {
        if ($record['type'] === 'income') {
            $total_income += (float)$record['amount'];
        } else {
            $total_expenses += (float)$record['amount'];
        }
    }

    $share_percentage = 0.10; // 10% share of total income
    $share_amount = $total_income * $share_percentage;
    $net_profit_after_share = $total_income - $total_expenses - $share_amount;

    $settlement_summary = "Franchisee owes Administration Rs. " . number_format($share_amount, 2) . " (10% of total income). ";
    if ($net_profit_after_share >= 0) {
        $settlement_summary .= "After expenses and share, franchisee's net profit is Rs. " . number_format($net_profit_after_share, 2) . ".";
    } else {
        $settlement_summary .= "After expenses and share, franchisee has a net loss of Rs. " . number_format(abs($net_profit_after_share), 2) . ".";
    }

    echo json_encode([
        'success' => true,
        'records' => $records,
        'summary' => [
            'total_income' => $total_income,
            'total_expenses' => $total_expenses,
            'net_profit_before_share' => $total_income - $total_expenses,
            'share_percentage' => $share_percentage * 100,
            'share_amount' => $share_amount,
            'net_profit_after_share' => $net_profit_after_share,
            'settlement_summary' => $settlement_summary
        ]
    ]);

} catch (PDOException $e) {
    echo json_encode(["success" => false, "message" => $e->getMessage()]);
}
?> 