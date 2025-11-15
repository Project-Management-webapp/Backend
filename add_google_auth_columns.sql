-- Add Google Authenticator columns to users table
-- Run this SQL script in your MySQL database

ALTER TABLE `users` 
ADD COLUMN `google_auth_enabled` TINYINT(1) DEFAULT 0 COMMENT 'Whether Google Authenticator 2FA is enabled',
ADD COLUMN `google_auth_secret` VARCHAR(255) DEFAULT NULL COMMENT 'Google Authenticator secret key';

-- Verify the columns were added
DESCRIBE `users`;
