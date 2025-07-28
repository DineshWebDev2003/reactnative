<?php
// ob_start(); // Disable output buffering for debugging
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json');

// Log all incoming requests and errors to a file
date_default_timezone_set('Asia/Kolkata');
$logFile = __DIR__ . '/create_order_debug.log';
file_put_contents($logFile, "\n==== " . date('Y-m-d H:i:s') . " ====".PHP_EOL, FILE_APPEND);
file_put_contents($logFile, 'Method: ' . $_SERVER['REQUEST_METHOD'] . PHP_EOL, FILE_APPEND);
file_put_contents($logFile, 'Headers: ' . json_encode(getallheaders()) . PHP_EOL, FILE_APPEND);
file_put_contents($logFile, 'Body: ' . file_get_contents('php://input') . PHP_EOL, FILE_APPEND);

// Catch all fatal errors and return JSON
register_shutdown_function(function() use ($logFile) {
    $error = error_get_last();
    if ($error && in_array($error['type'], [E_ERROR, E_PARSE, E_CORE_ERROR, E_COMPILE_ERROR])) {
        file_put_contents($logFile, 'Fatal error: ' . print_r($error, true) . PHP_EOL, FILE_APPEND);
        header('Content-Type: application/json');
        echo json_encode(['success' => false, 'message' => 'Fatal error: ' . $error['message']]);
        // ob_end_clean();
        exit;
    }
});

// Parse JSON input
$input = json_decode(file_get_contents('php://input'), true);
file_put_contents($logFile, 'Parsed input: ' . print_r($input, true) . PHP_EOL, FILE_APPEND);

// Check for required 'amount' in JSON
if (!isset($input['amount'])) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Missing amount']);
    // ob_end_clean();
    exit;
}
$amount = $input['amount'];

require '../vendor/autoload.php';
$key_id = 'rzp_live_v76KjQmyopGp8U';
$key_secret = 'xdX4z7zDERQkkpbmBD70XyOb';

try {
    $api = new Razorpay\Api\Api($key_id, $key_secret);
    $order = $api->order->create([
        'amount' => $amount * 100, // amount in paise
        'currency' => 'INR',
        'payment_capture' => 1
    ]);
    file_put_contents($logFile, 'Order created: ' . print_r($order, true) . PHP_EOL, FILE_APPEND);
    echo json_encode(['success' => true, 'order_id' => $order['id']]);
    // ob_end_clean();
    exit;
} catch (Exception $e) {
    file_put_contents($logFile, 'Exception: ' . $e->getMessage() . PHP_EOL, FILE_APPEND);
    echo json_encode(['success' => false, 'message' => 'Razorpay error: ' . $e->getMessage()]);
    // ob_end_clean();
    exit;
} 