-- V3: Add OAuth2, No-Show, Audit Log, and Notification tables
-- Also add password policy fields to users table

-- Add OAuth2 and password policy fields to users table
ALTER TABLE users
    ADD COLUMN IF NOT EXISTS oauth2_provider VARCHAR(50),
    ADD COLUMN IF NOT EXISTS oauth2_provider_id VARCHAR(255),
    ADD COLUMN IF NOT EXISTS password_changed_at TIMESTAMP,
    ADD COLUMN IF NOT EXISTS password_history TEXT;

-- Create audit_logs table
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id VARCHAR(36) NOT NULL,
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id VARCHAR(36),
    old_value TEXT,
    new_value TEXT,
    timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ip_address VARCHAR(45),
    user_agent VARCHAR(500)
);

-- Create indexes for audit_logs
CREATE INDEX IF NOT EXISTS idx_audit_log_admin_id ON audit_logs(admin_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_timestamp ON audit_logs(timestamp);

-- Create index for booking no-show queries
CREATE INDEX IF NOT EXISTS idx_booking_user_status ON bookings(user_id, status);

-- Add STAFF role support (no schema change needed, just role value in users table)