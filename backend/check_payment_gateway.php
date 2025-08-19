<?php
require_once 'config.php';
header('Content-Type: application/json');

try {
    $available = isRazorpayAvailable();
    echo json_encode([
        'success' => true,
        'razorpay_available' => $available,
        'message' => $available ? 'Payment gateway is available' : 'Payment gateway is not available'
    ]);
} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'razorpay_available' => false,
        'message' => 'Error checking payment gateway: ' . $e->getMessage()
    ]);
}
?> 