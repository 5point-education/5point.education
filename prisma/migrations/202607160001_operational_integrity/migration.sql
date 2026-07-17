-- Operational integrity migration.
-- This project was historically synchronized with `prisma db push`, so this
-- migration is intentionally idempotent and preserves existing records.

BEGIN;

DO $$ BEGIN
  CREATE TYPE "PaymentKind" AS ENUM ('BATCH_FEE', 'ADMISSION_CHARGE', 'LEGACY_UNALLOCATED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "AttendanceSessionType" AS ENUM ('REGULAR', 'EXTRA');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "AccountAuditAction" AS ENUM (
    'LOGIN_SUCCESS',
    'PASSWORD_RESET_REQUESTED',
    'EMAIL_CHANGED',
    'ACCOUNT_SUSPENDED',
    'ACCOUNT_REACTIVATED'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "NotificationEventType" AS ENUM (
    'ABSENCE_ALERT',
    'FEE_REMINDER',
    'EXAM_UPDATE',
    'NOTICE_ACK_REMINDER',
    'INACTIVE_STUDENT',
    'MISSED_ATTENDANCE'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "NotificationDeliveryStatus" AS ENUM ('SENT', 'FAILED', 'SKIPPED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "lastActivityAt" TIMESTAMP(3);
ALTER TABLE "admissions" ADD COLUMN IF NOT EXISTS "activeSubjectKey" TEXT;
ALTER TABLE "payments" ADD COLUMN IF NOT EXISTS "kind" "PaymentKind" NOT NULL DEFAULT 'LEGACY_UNALLOCATED';
ALTER TABLE "attendances" ADD COLUMN IF NOT EXISTS "sessionId" TEXT;
ALTER TABLE "notice_recipients" ADD COLUMN IF NOT EXISTS "acknowledgedAt" TIMESTAMP(3);

UPDATE "payments"
SET "kind" = 'BATCH_FEE'
WHERE cardinality("coveredMonths") > 0;

UPDATE "payments"
SET "kind" = 'ADMISSION_CHARGE'
WHERE "notes" ILIKE 'Admission Charge Payment%';

UPDATE "admissions" a
SET "activeSubjectKey" = lower(trim(b."subject"))
FROM "batches" b
WHERE a."batchId" = b."id"
  AND a."status" = 'ACTIVE'
  AND a."activeSubjectKey" IS NULL;

CREATE TABLE IF NOT EXISTS "attendance_sessions" (
  "id" TEXT NOT NULL,
  "batchId" TEXT NOT NULL,
  "date" TIMESTAMP(3) NOT NULL,
  "type" "AttendanceSessionType" NOT NULL DEFAULT 'REGULAR',
  "label" TEXT NOT NULL DEFAULT 'Regular Class',
  "createdById" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "attendance_sessions_pkey" PRIMARY KEY ("id")
);

INSERT INTO "attendance_sessions" ("id", "batchId", "date", "type", "label", "createdById", "createdAt", "updatedAt")
SELECT
  'legacy_' || md5(a."batchId" || ':' || a."date"::text),
  a."batchId",
  a."date",
  'REGULAR',
  'Regular Class',
  b."teacherId",
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
FROM (SELECT DISTINCT "batchId", "date" FROM "attendances") a
JOIN "batches" b ON b."id" = a."batchId"
ON CONFLICT ("id") DO NOTHING;

UPDATE "attendances" a
SET "sessionId" = 'legacy_' || md5(a."batchId" || ':' || a."date"::text)
WHERE a."sessionId" IS NULL;

ALTER TABLE "attendances"
  DROP CONSTRAINT IF EXISTS "attendances_date_batchId_studentId_key";

CREATE UNIQUE INDEX IF NOT EXISTS "attendances_sessionId_studentId_key"
  ON "attendances" ("sessionId", "studentId");
CREATE INDEX IF NOT EXISTS "attendance_sessions_batchId_date_idx"
  ON "attendance_sessions" ("batchId", "date");
CREATE INDEX IF NOT EXISTS "admissions_studentId_activeSubjectKey_idx"
  ON "admissions" ("studentId", "activeSubjectKey");

ALTER TABLE "attendance_sessions"
  ADD CONSTRAINT "attendance_sessions_batchId_fkey"
  FOREIGN KEY ("batchId") REFERENCES "batches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "attendance_sessions"
  ADD CONSTRAINT "attendance_sessions_createdById_fkey"
  FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "attendances"
  ADD CONSTRAINT "attendances_sessionId_fkey"
  FOREIGN KEY ("sessionId") REFERENCES "attendance_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE IF NOT EXISTS "account_audits" (
  "id" TEXT NOT NULL,
  "userId" TEXT,
  "actorId" TEXT,
  "action" "AccountAuditAction" NOT NULL,
  "email" TEXT,
  "ipAddress" TEXT,
  "userAgent" TEXT,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "account_audits_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "account_audits_userId_createdAt_idx" ON "account_audits" ("userId", "createdAt");
CREATE INDEX IF NOT EXISTS "account_audits_action_createdAt_idx" ON "account_audits" ("action", "createdAt");

CREATE TABLE IF NOT EXISTS "notification_deliveries" (
  "id" TEXT NOT NULL,
  "eventType" "NotificationEventType" NOT NULL,
  "status" "NotificationDeliveryStatus" NOT NULL,
  "dedupeKey" TEXT NOT NULL,
  "recipientPhone" TEXT,
  "recipientUserId" TEXT,
  "message" TEXT,
  "providerId" TEXT,
  "errorMessage" TEXT,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "sentAt" TIMESTAMP(3),
  CONSTRAINT "notification_deliveries_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "notification_deliveries_dedupeKey_key" ON "notification_deliveries" ("dedupeKey");
CREATE INDEX IF NOT EXISTS "notification_deliveries_eventType_createdAt_idx" ON "notification_deliveries" ("eventType", "createdAt");
CREATE INDEX IF NOT EXISTS "notification_deliveries_recipientUserId_createdAt_idx" ON "notification_deliveries" ("recipientUserId", "createdAt");

COMMIT;
