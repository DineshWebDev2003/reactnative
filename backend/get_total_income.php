<?php
include 'db.php';
header('Content-Type: application/json');

$sql = "SELECT SUM(amount) as total_income FROM income WHERE type='income' AND role='Franchisee'";
$result = $conn->query($sql);
$row = $result->fetch_assoc();
echo json_encode(['success' => true, 'total_income' => $row['total_income'] ?? 0]);
$conn->close();
?> 