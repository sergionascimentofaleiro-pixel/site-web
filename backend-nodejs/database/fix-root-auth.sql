-- Fix root authentication to use password
-- This will allow the full-reset.sh script to work with mysql -uroot -pPassword

-- Update root user to use mysql_native_password with password
ALTER USER 'root'@'localhost' IDENTIFIED VIA mysql_native_password USING PASSWORD('Manuela2011');

-- Flush privileges to apply changes
FLUSH PRIVILEGES;
