<?php
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);
require_once 'config.php';
require_once 'db.php';
header('Content-Type: application/json');

if (!isset($_GET['branch']) || empty($_GET['branch'])) {
    echo json_encode(['success' => false, 'error' => 'Missing branch parameter']);
    exit;
}

$branch = $_GET['branch'];
$particulars = isset($_GET['particulars']) ? $_GET['particulars'] : '';

try {
    // Ensure invoices table exists
    $pdo->exec("CREATE TABLE IF NOT EXISTS invoices (
        id INT AUTO_INCREMENT PRIMARY KEY,
        branch VARCHAR(255) NOT NULL,
        invoice_number INT NOT NULL,
        student_id INT,
        particulars VARCHAR(255),
        amount DECIMAL(10,2),
        mode VARCHAR(50),
        date DATE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )");

    // Get current month abbreviation
    $month = strtoupper(date('M'));
    // Build prefix
    $staticPrefix = "TNHK";
    $branchPrefix = strtoupper(substr($branch, 0, 2));
    $monthPrefix = $month;
    $particularsPrefix = $particulars ? strtoupper(substr($particulars, 0, 2)) : 'XX';

    // Get max invoice number for this branch
    $stmt = $pdo->prepare("SELECT MAX(invoice_number) as max_invoice FROM invoices WHERE branch = ?");
    $stmt->execute([$branch]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);
    $next_invoice_num = ($row && $row['max_invoice']) ? ((int)$row['max_invoice'] + 1) : 1;

    // Format as 3-digit number
    $next_invoice_str = str_pad($next_invoice_num, 3, '0', STR_PAD_LEFT);
    // Merge all parts
    $custom_invoice_number = "{$staticPrefix}{$branchPrefix}{$monthPrefix}{$particularsPrefix}{$next_invoice_str}";

    echo json_encode(['success' => true, 'invoice_number' => $custom_invoice_number]);
} catch (Exception $e) {
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
