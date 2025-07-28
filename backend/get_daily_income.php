<?php
require_once 'db.php';
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");

$branch = $_GET['branch'] ?? '';
$fee_per_student = 100; // Set your actual fee per student

$date = date('Y-m-d');

try {
    $stmt = $pdo->prepare("SELECT COUNT(*) as count FROM attendance WHERE branch=? AND date=? AND status='present'");
    $stmt->execute([$branch, $date]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);
    $income = $row['count'] * $fee_per_student;
    echo json_encode(["success" => true, "income" => $income]);
} catch (PDOException $e) {
    echo json_encode(["success" => false, "message" => $e->getMessage()]);
}
?> 