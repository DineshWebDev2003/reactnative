<?php
include 'db.php';
header('Content-Type: application/json');

$data = json_decode(file_get_contents('php://input'), true);
$parent_id = $data['parent_id'] ?? null;
$fee_due = $data['fee_due'] ?? null;

if (!$parent_id || $fee_due === null) {
    echo json_encode(['success' => false, 'message' => 'Missing parameters']);
    exit;
}

try {
    $stmt = $pdo->prepare("UPDATE users SET fee_due = ? WHERE id = ?");
    if ($stmt->execute([$fee_due, $parent_id])) {
        echo json_encode(['success' => true, 'message' => 'Fee updated successfully']);
    } else {
        echo json_encode(['success' => false, 'message' => 'Failed to update fee']);
    }
} catch (PDOException $e) {
    echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
}
?> 