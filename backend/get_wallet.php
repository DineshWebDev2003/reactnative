<?php
include 'db.php';
header('Content-Type: application/json');

$user_id = $_GET['user_id'] ?? null;
if (!$user_id) {
    echo json_encode(['success' => false, 'message' => 'User ID required']);
    exit;
}

try {
    // Get wallet and fee info with due date
    $stmt = $pdo->prepare("SELECT wallet_balance, fee_due, fee_due_date FROM users WHERE id = ?");
    $stmt->execute([$user_id]);
    $row = $stmt->fetch();
    if ($row) {
        $wallet_balance = isset($row['wallet_balance']) && is_numeric($row['wallet_balance']) ? $row['wallet_balance'] : 0;
        $fee_due = isset($row['fee_due']) && is_numeric($row['fee_due']) ? $row['fee_due'] : 0;
        
        // Use the fee_due_date if it exists, otherwise set to null
        $fee_due_date = $row['fee_due_date'] ?? null;

        // Get transaction history
        $stmt2 = $pdo->prepare("SELECT type, amount, date, status FROM transactions WHERE user_id = ? ORDER BY date DESC");
        $stmt2->execute([$user_id]);
        $transactions = $stmt2->fetchAll();

        echo json_encode([
            'success' => true,
            'wallet_balance' => $wallet_balance,
            'fee_due' => $fee_due,
            'fee_due_date' => $fee_due_date,
            'transactions' => $transactions
        ]);
    } else {
        echo json_encode(['success' => false, 'message' => 'User not found or wallet not available for this user.']);
    }
} catch (PDOException $e) {
    echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
}
?> 