-- Comprehensive Attendance System Fix
-- This script recreates and fixes the attendance system

-- Disable foreign key checks temporarily
SET FOREIGN_KEY_CHECKS = 0;

-- Drop existing attendance table if it has issues
DROP TABLE IF EXISTS `attendance`;

-- Drop attendance_logs table if it exists (it references attendance)
DROP TABLE IF EXISTS `attendance_logs`;

-- Re-enable foreign key checks
SET FOREIGN_KEY_CHECKS = 1;

-- Create a robust attendance table
CREATE TABLE `attendance` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `student_id` int(11) NOT NULL,
  `date` date NOT NULL,
  `status` enum('present','absent','late') NOT NULL DEFAULT 'absent',
  `in_time` time DEFAULT NULL,
  `out_time` time DEFAULT NULL,
  `marked_by` int(11) DEFAULT NULL,
  `method` enum('manual','qr','face','auto') DEFAULT 'manual',
  `guardian_id` int(11) DEFAULT NULL,
  `send_off` enum('yes','no') DEFAULT 'no',
  `notes` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_student_date` (`student_id`, `date`),
  KEY `idx_student_id` (`student_id`),
  KEY `idx_date` (`date`),
  KEY `idx_marked_by` (`marked_by`),
  KEY `idx_branch_date` (`date`),
  KEY `idx_status` (`status`),
  KEY `idx_method` (`method`),
  CONSTRAINT `fk_attendance_student` FOREIGN KEY (`student_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_attendance_marked_by` FOREIGN KEY (`marked_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create attendance_logs table for tracking changes
CREATE TABLE IF NOT EXISTS `attendance_logs` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `attendance_id` int(11) NOT NULL,
  `student_id` int(11) NOT NULL,
  `old_status` enum('present','absent','late') DEFAULT NULL,
  `new_status` enum('present','absent','late') NOT NULL,
  `changed_by` int(11) NOT NULL,
  `change_reason` varchar(255) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_attendance_id` (`attendance_id`),
  KEY `idx_student_id` (`student_id`),
  KEY `idx_changed_by` (`changed_by`),
  CONSTRAINT `fk_logs_attendance` FOREIGN KEY (`attendance_id`) REFERENCES `attendance` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_logs_student` FOREIGN KEY (`student_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_logs_changed_by` FOREIGN KEY (`changed_by`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create attendance_settings table for configuration
CREATE TABLE IF NOT EXISTS `attendance_settings` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `branch` varchar(100) NOT NULL,
  `setting_key` varchar(100) NOT NULL,
  `setting_value` text NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_branch_setting` (`branch`, `setting_key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert default attendance settings
INSERT INTO `attendance_settings` (`branch`, `setting_key`, `setting_value`) VALUES
('Main Branch', 'qr_scan_timeout', '3000'),
('Main Branch', 'auto_mark_absent_after', '09:30:00'),
('Main Branch', 'late_threshold', '08:15:00'),
('Main Branch', 'enable_face_recognition', 'true'),
('Main Branch', 'enable_qr_scanning', 'true'),
('Main Branch', 'enable_manual_marking', 'true');

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS `idx_attendance_student_date` ON `attendance` (`student_id`, `date`);
CREATE INDEX IF NOT EXISTS `idx_attendance_branch_date` ON `attendance` (`date`);
CREATE INDEX IF NOT EXISTS `idx_attendance_status_date` ON `attendance` (`status`, `date`);

-- Add triggers for attendance logging
DELIMITER $$

CREATE TRIGGER `attendance_after_insert` 
AFTER INSERT ON `attendance`
FOR EACH ROW
BEGIN
    INSERT INTO `attendance_logs` (`attendance_id`, `student_id`, `new_status`, `changed_by`, `change_reason`)
    VALUES (NEW.id, NEW.student_id, NEW.status, NEW.marked_by, CONCAT('Initial mark via ', NEW.method));
END$$

CREATE TRIGGER `attendance_after_update` 
AFTER UPDATE ON `attendance`
FOR EACH ROW
BEGIN
    IF OLD.status != NEW.status THEN
        INSERT INTO `attendance_logs` (`attendance_id`, `student_id`, `old_status`, `new_status`, `changed_by`, `change_reason`)
        VALUES (NEW.id, NEW.student_id, OLD.status, NEW.status, NEW.marked_by, CONCAT('Status changed via ', NEW.method));
    END IF;
END$$

DELIMITER ;

-- Verify the structure
SELECT 'Attendance table created successfully' as status; 