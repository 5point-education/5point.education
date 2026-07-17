-- Record successful password reset completions in the account audit trail.
ALTER TYPE "AccountAuditAction" ADD VALUE IF NOT EXISTS 'PASSWORD_RESET_COMPLETED';
