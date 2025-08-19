<?php
require_once 'db.php';
header('Content-Type: application/json');

$branch = isset($_GET['branch']) ? trim($_GET['branch']) : '';
if (!$branch) {
    echo json_encode(['success' => false, 'error' => 'Missing branch']);
    exit;
}

try {
    $stmt = $pdo->prepare("SELECT * FROM invoices WHERE branch = ? ORDER BY date DESC, id DESC");
    $stmt->execute([$branch]);
    $invoices = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo json_encode(['success' => true, 'invoices' => $invoices]);
} catch (Exception $e) {
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
