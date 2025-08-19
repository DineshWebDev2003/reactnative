<?php
// App Configuration
define('APP_NAME', 'TN Happy Kids');
define('APP_VERSION', '1.0.0');

// Razorpay Configuration
define('RAZORPAY_ENABLED', true); // Set to false to disable Razorpay
define('RAZORPAY_KEY_ID', 'rzp_live_v76KjQmyopGp8U');
define('RAZORPAY_KEY_SECRET', 'xdX4z7zDERQkkpbmBD70XyOb');

// Payment Settings
define('MIN_PAYMENT_AMOUNT', 1); // Minimum amount in INR
define('MAX_PAYMENT_AMOUNT', 5000); // Maximum amount in INR

// Feature Flags
define('FEATURE_WALLET_ENABLED', true);
define('FEATURE_FEE_PAYMENT_ENABLED', true);
define('FEATURE_ADD_MONEY_ENABLED', true);

// Debug Settings
define('DEBUG_MODE', false);
define('LOG_PAYMENTS', true);

// Helper function to check if Razorpay is available
function isRazorpayAvailable() {
    return RAZORPAY_ENABLED && !empty(RAZORPAY_KEY_ID) && !empty(RAZORPAY_KEY_SECRET);
}

// Helper function to get payment status message
function getPaymentStatusMessage($status) {
    switch ($status) {
        case 'success':
            return 'Payment successful';
        case 'pending':
            return 'Payment pending';
        case 'failed':
            return 'Payment failed';
        case 'cancelled':
            return 'Payment cancelled';
        default:
            return 'Unknown status';
    }
}

// Helper function to format currency
function formatCurrency($amount) {
    return '₹' . number_format($amount, 2);
}

// Helper function to validate amount
function validateAmount($amount) {
    $amount = floatval($amount);
    return $amount >= MIN_PAYMENT_AMOUNT && $amount <= MAX_PAYMENT_AMOUNT;
}
?> 