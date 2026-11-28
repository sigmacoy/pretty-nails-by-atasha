-- V3: Add OAuth2, No-Show, Audit Log, and Notification tables
-- Also add password policy fields to users table

-- Add OAuth2 and password policy fields to users table
ALTER TABLE users
    ADD COLUMN IF NOT EXISTS oauth2_provider VARCHAR(50),
    ADD COLUMN IF NOT EXISTS oauth2_provider_id VARCHAR(255),
    ADD COLUMN IF NOT EXISTS password_changed_at TIMESTAMP,
    ADD COLUMN IF NOT EXISTS password_history TEXT;

-- Create audit_logs table (aligned with AuditLog.java entity)
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id VARCHAR(36),
    user_email VARCHAR(255),
    user_role VARCHAR(20),
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50),
    entity_id VARCHAR(36),
    description VARCHAR(2000),
    metadata JSONB,
    ip_address VARCHAR(45),
    user_agent VARCHAR(2000),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for audit_logs (matching AuditLog.java @Index definitions)
CREATE INDEX IF NOT EXISTS idx_audit_log_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_log_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_created_at ON audit_logs(created_at);

-- Create index for booking no-show queries
CREATE INDEX IF NOT EXISTS idx_booking_user_status ON bookings(user_id, status);

-- Add STAFF role support (no schema change needed, just role value in users table)