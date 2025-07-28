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
    // Update wallet balance
    $stmt = $pdo->prepare("UPDATE users SET wallet_balance = wallet_balance + ? WHERE id = ?");
    $stmt->execute([$amount, $user_id]);

    // Record transaction
    $stmt2 = $pdo->prepare("INSERT INTO transactions (user_id, type, amount, razorpay_payment_id, razorpay_order_id, status) VALUES (?, 'add_money', ?, ?, ?, 'success')");
    $stmt2->execute([$user_id, $amount, $razorpay_payment_id, $razorpay_order_id]);

    // After recording transaction
    $stmt3 = $pdo->prepare("INSERT INTO income (user_id, branch, amount, type) VALUES (?, (SELECT branch FROM users WHERE id = ?), ?, 'add_money')");
    $stmt3->execute([$user_id, $user_id, $amount]);

    echo json_encode(['success' => true, 'message' => 'Money added to wallet']);
} catch (Exception $e) {
    echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
}
?> 