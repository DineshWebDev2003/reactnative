<?php
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);
require_once 'db.php';
header('Content-Type: application/json');

// Helper function to get POST value safely
function get_post($key) {
    return isset($_POST[$key]) ? trim($_POST[$key]) : '';
}

$branch = get_post('branch');
$invoice_number = get_post('invoice_number');
$student_id = get_post('student_id');
$particulars = get_post('particulars');
$amount = get_post('amount');
$mode = get_post('mode');
$transaction_id = get_post('transaction_id');
$date = get_post('date');

// Validate required fields
$missing = [];
foreach (['branch','invoice_number','student_id','particulars','amount','mode','date'] as $field) {
    if (empty($$field)) $missing[] = $field;
}
if (strtolower($mode) !== 'cash' && empty($transaction_id)) {
    $missing[] = 'transaction_id';
}
if (!empty($missing)) {
    echo json_encode(['success' => false, 'error' => 'Missing required fields: ' . implode(', ', $missing)]);
    exit;
}

try {
    $stmt = $pdo->prepare("INSERT INTO invoices 
        (branch, invoice_number, student_id, particulars, amount, mode, transaction_id, date)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
    $stmt->execute([
        $branch,
        $invoice_number,
        $student_id,
        $particulars,
        $amount,
        $mode,
        $transaction_id,
        $date
    ]);
    echo json_encode(['success' => true, 'message' => 'Invoice created successfully']);
} catch (Exception $e) {
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}