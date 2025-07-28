<?php
require_once 'db.php'; // adjust if your DB connection file is named differently

header('Content-Type: application/json');

$branch = isset($_GET['branch']) ? $_GET['branch'] : '';

try {
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    $sql = "SELECT * FROM timetable_periods WHERE (branch = ? OR branch IS NULL OR branch = '' OR branch = 'ALL') ORDER BY day, start_time ASC";
    $params = [$branch];

    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);

    $periods = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode([
        "success" => true,
        "periods" => $periods
    ]);
} catch (PDOException $e) {
    echo json_encode([
        "success" => false,
        "message" => $e->getMessage()
    ]);
}