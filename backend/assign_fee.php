<?php
require_once 'db.php';
header('Content-Type: application/json');

$data = json_decode(file_get_contents('php://input'), true);
$user_id = $data['user_id'] ?? null;
$amount = $data['amount'] ?? 0;
$due_date = $data['due_date'] ?? null; // Optional: custom due date

if (!$user_id || !$amount) {
    echo json_encode(['success' => false, 'message' => 'User ID and amount required']);
    exit;
}

try {
    // Calculate due date: 30 days from now or use provided date
    if (!$due_date) {
        $due_date = date('Y-m-d', strtotime('+30 days'));
    }
    
    // Update user's fee and due date
    $stmt = $pdo->prepare("UPDATE users SET fee_due = ?, fee_due_date = ? WHERE id = ?");
    $stmt->execute([$amount, $due_date, $user_id]);
    
    if ($stmt->rowCount() > 0) {
        echo json_encode([
            'success' => true, 
            'message' => 'Fee assigned successfully',
            'fee_amount' => $amount,
            'due_date' => $due_date,
            'days_remaining' => ceil((strtotime($due_date) - time()) / (60 * 60 * 24))
        ]);
    } else {
        echo json_encode(['success' => false, 'message' => 'User not found']);
    }
    
} catch (Exception $e) {
    echo json_encode(['success' => false, 'message' => 'Error: ' . $e->getMessage()]);
}
?> 