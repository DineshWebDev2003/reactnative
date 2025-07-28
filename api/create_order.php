<?php
require_once __DIR__ . '/../vendor/autoload.php'; // Adjust path if needed
use Razorpay\Api\Api;

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Headers: *');
header('Content-Type: application/json');

$key_id = 'rzp_test_opkVxJ1nyMeESX';
$key_secret = 'd4D7yml0bojOrmI3HnI0Grvw';

$api = new Api($key_id, $key_secret);

$data = json_decode(file_get_contents('php://input'), true);
$amount = $data['amount'] ?? 0;

if ($amount <= 0) {
    echo json_encode(['success' => false, 'message' => 'Invalid amount']);
    exit;
}

try {
    $order = $api->order->create([
        'amount' => $amount * 100,
        'currency' => 'INR',
        'payment_capture' => 1
    ]);
    echo json_encode(['success' => true, 'order_id' => $order['id']]);
} catch (Exception $e) {
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
?> 