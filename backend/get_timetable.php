<?php
require_once 'db.php';

header('Content-Type: application/json');

$branch = isset($_GET['branch']) ? $_GET['branch'] : '';

try {
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    // Get timetable periods specifically for this branch or general ones
    // Priority: 1. Branch-specific, 2. ALL (general), 3. NULL (default)
    $sql = "SELECT * FROM timetable_periods 
            WHERE branch = ? OR branch = 'ALL' OR branch IS NULL OR branch = ''
            ORDER BY 
            CASE day 
                WHEN 'monday' THEN 1 
                WHEN 'tuesday' THEN 2 
                WHEN 'wednesday' THEN 3 
                WHEN 'thursday' THEN 4 
                WHEN 'friday' THEN 5 
                WHEN 'saturday' THEN 6 
                WHEN 'sunday' THEN 7 
                ELSE 8 
            END, 
            start_time ASC";
    $params = [$branch];

    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);

    $periods = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Log for debugging
    error_log("Timetable request for branch: $branch");
    error_log("Found " . count($periods) . " periods");

    // Group periods by day for better organization
    $organizedPeriods = [];
    foreach ($periods as $period) {
        $day = strtolower($period['day']);
        if (!isset($organizedPeriods[$day])) {
            $organizedPeriods[$day] = [];
        }
        $organizedPeriods[$day][] = $period;
    }

    echo json_encode([
        "success" => true,
        "periods" => $periods,
        "organized_periods" => $organizedPeriods,
        "branch" => $branch,
        "total_periods" => count($periods)
    ]);
} catch (PDOException $e) {
    error_log("Timetable error: " . $e->getMessage());
    echo json_encode([
        "success" => false,
        "message" => $e->getMessage()
    ]);
}
?>