-- CreateIndex
CREATE INDEX IF NOT EXISTS "installment_schedule_status_dueDate_idx" ON "installment_schedule"("status", "dueDate");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "payments_createdAt_idx" ON "payments"("createdAt");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "event_log_eventType_createdAt_idx" ON "event_log"("eventType", "createdAt");
