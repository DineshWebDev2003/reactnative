<?php
include 'db.php';

$requiredTables = ['users', 'homework', 'homework_submissions'];
$existingTables = [];

$stmt = $pdo->query("SHOW TABLES");
while ($row = $stmt->fetch(PDO::FETCH_NUM)) {
    $existingTables[] = $row[0];
}

foreach ($requiredTables as $table) {
    if (in_array($table, $existingTables)) {
        echo "Table '$table' exists.\n";
    } else {
        echo "Table '$table' does NOT exist.\n";
    }
}
?> 