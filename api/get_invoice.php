<?php
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Headers: *');
header('Content-Type: application/json');

require_once __DIR__ . '/../backend/db.php';

$transaction_id = $_GET['transaction_id'] ?? null;
if (!$transaction_id) {
    echo json_encode(['success' => false, 'message' => 'Transaction ID required']);
    exit;
}

try {
    // Fetch transaction and user info
    $stmt = $pdo->prepare("SELECT t.*, u.name as parent_name, u.childName as student_name, u.childClass, u.branch, u.mobile, u.email, u.father_name, u.mother_name, u.student_id, u.staff_id, u.role FROM transactions t JOIN users u ON t.user_id = u.id WHERE t.razorpay_payment_id = ? OR t.razorpay_order_id = ? LIMIT 1");
    $stmt->execute([$transaction_id, $transaction_id]);
    $invoice = $stmt->fetch();

    if ($invoice) {
        // Fetch franchisee info
        $franchisee = null;
        if ($invoice['branch']) {
            $stmt2 = $pdo->prepare("SELECT name, mobile FROM users WHERE branch = ? AND role = 'franchisee' LIMIT 1");
            $stmt2->execute([$invoice['branch']]);
            $franchisee = $stmt2->fetch();
        }
        echo json_encode([
            'success' => true,
            'invoice' => $invoice,
            'franchisee' => $franchisee
        ]);
    } else {
        echo json_encode(['success' => false, 'message' => 'Invoice not found']);
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Error fetching invoice', 'error' => $e->getMessage()]);
}
?> 