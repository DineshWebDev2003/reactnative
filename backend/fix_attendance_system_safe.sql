-- Safe Attendance System Fix (Alternative Approach)
-- This script modifies the existing attendance table without dropping it

-- First, let's check if the attendance table exists and its current structure
SELECT 'Checking existing attendance table structure...' as status;

-- Create attendance_logs table if it doesn't exist
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
  KEY `idx_changed_by` (`changed_by`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create attendance_settings table if it doesn't exist
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

-- Add missing columns to attendance table (check if they exist first)
-- Method column
SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
     WHERE TABLE_SCHEMA = DATABASE() 
     AND TABLE_NAME = 'attendance' 
     AND COLUMN_NAME = 'method') = 0,
    'ALTER TABLE `attendance` ADD COLUMN `method` enum(\'manual\',\'qr\',\'face\',\'auto\') DEFAULT \'manual\' AFTER `marked_by`',
    'SELECT \'method column already exists\' as status'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Guardian ID column
SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
     WHERE TABLE_SCHEMA = DATABASE() 
     AND TABLE_NAME = 'attendance' 
     AND COLUMN_NAME = 'guardian_id') = 0,
    'ALTER TABLE `attendance` ADD COLUMN `guardian_id` int(11) DEFAULT NULL AFTER `method`',
    'SELECT \'guardian_id column already exists\' as status'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Send off column
SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
     WHERE TABLE_SCHEMA = DATABASE() 
     AND TABLE_NAME = 'attendance' 
     AND COLUMN_NAME = 'send_off') = 0,
    'ALTER TABLE `attendance` ADD COLUMN `send_off` enum(\'yes\',\'no\') DEFAULT \'no\' AFTER `guardian_id`',
    'SELECT \'send_off column already exists\' as status'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Notes column
SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
     WHERE TABLE_SCHEMA = DATABASE() 
     AND TABLE_NAME = 'attendance' 
     AND COLUMN_NAME = 'notes') = 0,
    'ALTER TABLE `attendance` ADD COLUMN `notes` text DEFAULT NULL AFTER `send_off`',
    'SELECT \'notes column already exists\' as status'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Created at column
SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
     WHERE TABLE_SCHEMA = DATABASE() 
     AND TABLE_NAME = 'attendance' 
     AND COLUMN_NAME = 'created_at') = 0,
    'ALTER TABLE `attendance` ADD COLUMN `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP AFTER `notes`',
    'SELECT \'created_at column already exists\' as status'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Updated at column
SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
     WHERE TABLE_SCHEMA = DATABASE() 
     AND TABLE_NAME = 'attendance' 
     AND COLUMN_NAME = 'updated_at') = 0,
    'ALTER TABLE `attendance` ADD COLUMN `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP AFTER `created_at`',
    'SELECT \'updated_at column already exists\' as status'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add unique constraint if it doesn't exist
SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS 
     WHERE TABLE_SCHEMA = DATABASE() 
     AND TABLE_NAME = 'attendance' 
     AND INDEX_NAME = 'unique_student_date') = 0,
    'ALTER TABLE `attendance` ADD UNIQUE KEY `unique_student_date` (`student_id`, `date`)',
    'SELECT \'unique_student_date constraint already exists\' as status'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add indexes for better performance (check if they exist first)
-- Student ID index
SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS 
     WHERE TABLE_SCHEMA = DATABASE() 
     AND TABLE_NAME = 'attendance' 
     AND INDEX_NAME = 'idx_student_id') = 0,
    'ALTER TABLE `attendance` ADD INDEX `idx_student_id` (`student_id`)',
    'SELECT \'idx_student_id index already exists\' as status'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Date index
SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS 
     WHERE TABLE_SCHEMA = DATABASE() 
     AND TABLE_NAME = 'attendance' 
     AND INDEX_NAME = 'idx_date') = 0,
    'ALTER TABLE `attendance` ADD INDEX `idx_date` (`date`)',
    'SELECT \'idx_date index already exists\' as status'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Marked by index
SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS 
     WHERE TABLE_SCHEMA = DATABASE() 
     AND TABLE_NAME = 'attendance' 
     AND INDEX_NAME = 'idx_marked_by') = 0,
    'ALTER TABLE `attendance` ADD INDEX `idx_marked_by` (`marked_by`)',
    'SELECT \'idx_marked_by index already exists\' as status'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Status index
SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS 
     WHERE TABLE_SCHEMA = DATABASE() 
     AND TABLE_NAME = 'attendance' 
     AND INDEX_NAME = 'idx_status') = 0,
    'ALTER TABLE `attendance` ADD INDEX `idx_status` (`status`)',
    'SELECT \'idx_status index already exists\' as status'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Method index
SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS 
     WHERE TABLE_SCHEMA = DATABASE() 
     AND TABLE_NAME = 'attendance' 
     AND INDEX_NAME = 'idx_method') = 0,
    'ALTER TABLE `attendance` ADD INDEX `idx_method` (`method`)',
    'SELECT \'idx_method index already exists\' as status'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Student date composite index
SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS 
     WHERE TABLE_SCHEMA = DATABASE() 
     AND TABLE_NAME = 'attendance' 
     AND INDEX_NAME = 'idx_student_date') = 0,
    'ALTER TABLE `attendance` ADD INDEX `idx_student_date` (`student_id`, `date`)',
    'SELECT \'idx_student_date index already exists\' as status'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Insert default attendance settings (ignore duplicates)
INSERT IGNORE INTO `attendance_settings` (`branch`, `setting_key`, `setting_value`) VALUES
('Main Branch', 'qr_scan_timeout', '3000'),
('Main Branch', 'auto_mark_absent_after', '09:30:00'),
('Main Branch', 'late_threshold', '08:15:00'),
('Main Branch', 'enable_face_recognition', 'true'),
('Main Branch', 'enable_qr_scanning', 'true'),
('Main Branch', 'enable_manual_marking', 'true');

-- Try to add foreign key constraints (they might already exist or fail)
-- Note: We'll handle foreign key errors gracefully

-- Try to add foreign key for student_id
SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
     WHERE TABLE_SCHEMA = DATABASE() 
     AND TABLE_NAME = 'attendance' 
     AND COLUMN_NAME = 'student_id' 
     AND REFERENCED_TABLE_NAME = 'users') = 0,
    'ALTER TABLE `attendance` ADD CONSTRAINT `fk_attendance_student` FOREIGN KEY (`student_id`) REFERENCES `users` (`id`) ON DELETE CASCADE',
    'SELECT \'fk_attendance_student constraint already exists\' as status'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Try to add foreign key for marked_by
SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
     WHERE TABLE_SCHEMA = DATABASE() 
     AND TABLE_NAME = 'attendance' 
     AND COLUMN_NAME = 'marked_by' 
     AND REFERENCED_TABLE_NAME = 'users') = 0,
    'ALTER TABLE `attendance` ADD CONSTRAINT `fk_attendance_marked_by` FOREIGN KEY (`marked_by`) REFERENCES `users` (`id`) ON DELETE SET NULL',
    'SELECT \'fk_attendance_marked_by constraint already exists\' as status'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add foreign key constraints to attendance_logs (if they don't exist)
-- Try to add foreign key for attendance_id in logs
SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
     WHERE TABLE_SCHEMA = DATABASE() 
     AND TABLE_NAME = 'attendance_logs' 
     AND COLUMN_NAME = 'attendance_id' 
     AND REFERENCED_TABLE_NAME = 'attendance') = 0,
    'ALTER TABLE `attendance_logs` ADD CONSTRAINT `fk_logs_attendance` FOREIGN KEY (`attendance_id`) REFERENCES `attendance` (`id`) ON DELETE CASCADE',
    'SELECT \'fk_logs_attendance constraint already exists\' as status'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Try to add foreign key for student_id in logs
SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
     WHERE TABLE_SCHEMA = DATABASE() 
     AND TABLE_NAME = 'attendance_logs' 
     AND COLUMN_NAME = 'student_id' 
     AND REFERENCED_TABLE_NAME = 'users') = 0,
    'ALTER TABLE `attendance_logs` ADD CONSTRAINT `fk_logs_student` FOREIGN KEY (`student_id`) REFERENCES `users` (`id`) ON DELETE CASCADE',
    'SELECT \'fk_logs_student constraint already exists\' as status'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Try to add foreign key for changed_by in logs
SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
     WHERE TABLE_SCHEMA = DATABASE() 
     AND TABLE_NAME = 'attendance_logs' 
     AND COLUMN_NAME = 'changed_by' 
     AND REFERENCED_TABLE_NAME = 'users') = 0,
    'ALTER TABLE `attendance_logs` ADD CONSTRAINT `fk_logs_changed_by` FOREIGN KEY (`changed_by`) REFERENCES `users` (`id`) ON DELETE CASCADE',
    'SELECT \'fk_logs_changed_by constraint already exists\' as status'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Create triggers for attendance logging (drop if they exist first)
DROP TRIGGER IF EXISTS `attendance_after_insert`;
DROP TRIGGER IF EXISTS `attendance_after_update`;

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
SELECT 'Attendance table updated successfully' as status; 