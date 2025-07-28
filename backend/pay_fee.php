<?php
include 'db.php';
header('Content-Type: application/json');

$data = json_decode(file_get_contents('php://input'), true);
$user_id = $data['user_id'] ?? null;
$amount = $data['amount'] ?? 0;
$razorpay_payment_id = $data['razorpay_payment_id'] ?? null;
$razorpay_order_id = $data['razorpay_order_id'] ?? null;

if (!$user_id || !$amount || !$razorpay_payment_id || !$razorpay_order_id) {
    echo json_encode(['success' => false, 'message' => 'Missing parameters']);
    exit;
}

try {
    // Check wallet balance and fee due
    $stmt = $pdo->prepare("SELECT wallet_balance, fee_due FROM users WHERE id = ?");
    $stmt->execute([$user_id]);
    $row = $stmt->fetch();
    if ($row) {
        if ($row['wallet_balance'] < $amount) {
            echo json_encode(['success' => false, 'message' => 'Insufficient wallet balance']);
            exit;
        }
        if ($row['fee_due'] < $amount) {
            echo json_encode(['success' => false, 'message' => 'Amount exceeds fee due']);
            exit;
        }
        // Deduct from wallet and fee_due
        $stmt2 = $pdo->prepare("UPDATE users SET wallet_balance = wallet_balance - ?, fee_due = fee_due - ? WHERE id = ?");
        $stmt2->execute([$amount, $amount, $user_id]);
        // Record transaction
        $stmt3 = $pdo->prepare("INSERT INTO transactions (user_id, type, amount, razorpay_payment_id, razorpay_order_id, status) VALUES (?, 'pay_fee', ?, ?, ?, 'success')");
        $stmt3->execute([$user_id, $amount, $razorpay_payment_id, $razorpay_order_id]);
        // After recording transaction
        $stmt4 = $pdo->prepare("INSERT INTO income (user_id, branch, amount, type) VALUES (?, (SELECT branch FROM users WHERE id = ?), ?, 'pay_fee')");
        $stmt4->execute([$user_id, $user_id, $amount]);
        echo json_encode(['success' => true, 'message' => 'Fee paid successfully']);
    } else {
        echo json_encode(['success' => false, 'message' => 'User not found']);
    }
} catch (Exception $e) {
    echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
}
?> 