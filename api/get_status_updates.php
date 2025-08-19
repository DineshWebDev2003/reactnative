<?php
header('Content-Type: application/json');

// Dummy data for status updates
$statuses = [
    [
        'id' => 1,
        'branch_name' => 'Main Branch',
        'thumbnail_url' => 'https://app.tnhappykids.in/assets/frames/frame1.png',
        'updates' => [
            ['type' => 'image', 'url' => 'https://app.tnhappykids.in/assets/frames/frame1.png', 'timestamp' => '2023-10-27 10:00:00'],
            ['type' => 'video', 'url' => 'https://sample-videos.com/video123/mp4/720/big_buck_bunny_720p_1mb.mp4', 'timestamp' => '2023-10-27 10:05:00'],
        ]
    ],
    [
        'id' => 2,
        'branch_name' => 'Downtown Branch',
        'thumbnail_url' => 'https://app.tnhappykids.in/assets/frames/frame2.png',
        'updates' => [
            ['type' => 'image', 'url' => 'https://app.tnhappykids.in/assets/frames/frame2.png', 'timestamp' => '2023-10-27 11:30:00'],
        ]
    ],
    [
        'id' => 3,
        'branch_name' => 'Westside Branch',
        'thumbnail_url' => 'https://app.tnhappykids.in/assets/frames/frame3.png',
        'updates' => [
            ['type' => 'image', 'url' => 'https://app.tnhappykids.in/assets/frames/frame3.png', 'timestamp' => '2023-10-27 12:00:00'],
            ['type' => 'image', 'url' => 'https://app.tnhappykids.in/assets/frames/frame4.png', 'timestamp' => '2023-10-27 12:15:00'],
        ]
    ]
];

echo json_encode(['success' => true, 'statuses' => $statuses]);
?>
