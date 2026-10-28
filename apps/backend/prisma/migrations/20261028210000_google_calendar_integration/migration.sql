-- AlterTable
ALTER TABLE "CalendarConnection" DROP COLUMN "encryptedCredentials",
ADD COLUMN     "accessTokenExpiresAt" TIMESTAMP(3),
ADD COLUMN     "calendarName" TEXT,
ADD COLUMN     "calendarTimezone" TEXT,
ADD COLUMN     "encryptedAccessToken" TEXT,
ADD COLUMN     "encryptedRefreshToken" TEXT,
ADD COLUMN     "googleAccountEmail" TEXT,
ADD COLUMN     "grantedScopes" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "lastError" TEXT,
ADD COLUMN     "lastErrorAt" TIMESTAMP(3),
ADD COLUMN     "lastSuccessfulSyncAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "CalendarEventMapping" (
    "id" TEXT NOT NULL,
    "calendarConnectionId" TEXT NOT NULL,
    "bookingId" TEXT,
    "resourceBlockId" TEXT,
    "externalEventId" TEXT NOT NULL,
    "externalEventEtag" TEXT,
    "aggregateVersion" INTEGER NOT NULL DEFAULT 1,
    "syncStatus" TEXT NOT NULL DEFAULT 'SYNCED',
    "lastSyncedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastError" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CalendarEventMapping_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CalendarSyncState" (
    "id" TEXT NOT NULL,
    "connectionId" TEXT NOT NULL,
    "nextSyncToken" TEXT,
    "lastFullSyncAt" TIMESTAMP(3),
    "lastIncrementalSyncAt" TIMESTAMP(3),
    "lastSuccessfulSyncAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CalendarSyncState_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CalendarWebhookChannel" (
    "id" TEXT NOT NULL,
    "connectionId" TEXT NOT NULL,
    "channelId" TEXT NOT NULL,
    "resourceId" TEXT NOT NULL,
    "verificationTokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CalendarWebhookChannel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CalendarSyncJob" (
    "id" TEXT NOT NULL,
    "connectionId" TEXT NOT NULL,
    "aggregateType" TEXT NOT NULL,
    "aggregateId" TEXT NOT NULL,
    "operation" TEXT NOT NULL,
    "aggregateVersion" INTEGER NOT NULL DEFAULT 1,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "attemptCount" INTEGER NOT NULL DEFAULT 0,
    "nextAttemptAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lockedUntil" TIMESTAMP(3),
    "lockedBy" TEXT,
    "lastError" TEXT,
    "payload" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CalendarSyncJob_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CalendarSyncConflict" (
    "id" TEXT NOT NULL,
    "connectionId" TEXT NOT NULL,
    "bookingId" TEXT,
    "externalEventId" TEXT,
    "conflictType" TEXT NOT NULL,
    "localSnapshot" JSONB,
    "remoteSnapshot" JSONB,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "detectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),
    "resolvedByUserId" TEXT,
    "resolutionNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CalendarSyncConflict_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExternalCalendarEvent" (
    "id" TEXT NOT NULL,
    "connectionId" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "etag" TEXT,
    "summary" TEXT,
    "startAt" TIMESTAMP(3) NOT NULL,
    "endAt" TIMESTAMP(3) NOT NULL,
    "isBusy" BOOLEAN NOT NULL DEFAULT true,
    "isAllDay" BOOLEAN NOT NULL DEFAULT false,
    "sourceType" TEXT NOT NULL DEFAULT 'EXTERNAL_BUSY',
    "lastObservedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExternalCalendarEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CalendarEventMapping_bookingId_key" ON "CalendarEventMapping"("bookingId");

-- CreateIndex
CREATE INDEX "CalendarEventMapping_calendarConnectionId_syncStatus_idx" ON "CalendarEventMapping"("calendarConnectionId", "syncStatus");

-- CreateIndex
CREATE INDEX "CalendarEventMapping_bookingId_idx" ON "CalendarEventMapping"("bookingId");

-- CreateIndex
CREATE UNIQUE INDEX "CalendarEventMapping_calendarConnectionId_externalEventId_key" ON "CalendarEventMapping"("calendarConnectionId", "externalEventId");

-- CreateIndex
CREATE UNIQUE INDEX "CalendarSyncState_connectionId_key" ON "CalendarSyncState"("connectionId");

-- CreateIndex
CREATE UNIQUE INDEX "CalendarWebhookChannel_channelId_key" ON "CalendarWebhookChannel"("channelId");

-- CreateIndex
CREATE INDEX "CalendarWebhookChannel_connectionId_status_idx" ON "CalendarWebhookChannel"("connectionId", "status");

-- CreateIndex
CREATE INDEX "CalendarWebhookChannel_expiresAt_idx" ON "CalendarWebhookChannel"("expiresAt");

-- CreateIndex
CREATE INDEX "CalendarSyncJob_status_nextAttemptAt_idx" ON "CalendarSyncJob"("status", "nextAttemptAt");

-- CreateIndex
CREATE INDEX "CalendarSyncJob_connectionId_status_idx" ON "CalendarSyncJob"("connectionId", "status");

-- CreateIndex
CREATE INDEX "CalendarSyncJob_aggregateType_aggregateId_idx" ON "CalendarSyncJob"("aggregateType", "aggregateId");

-- CreateIndex
CREATE INDEX "CalendarSyncConflict_connectionId_status_idx" ON "CalendarSyncConflict"("connectionId", "status");

-- CreateIndex
CREATE INDEX "CalendarSyncConflict_bookingId_idx" ON "CalendarSyncConflict"("bookingId");

-- CreateIndex
CREATE INDEX "ExternalCalendarEvent_connectionId_startAt_endAt_idx" ON "ExternalCalendarEvent"("connectionId", "startAt", "endAt");

-- CreateIndex
CREATE INDEX "ExternalCalendarEvent_sourceType_idx" ON "ExternalCalendarEvent"("sourceType");

-- CreateIndex
CREATE UNIQUE INDEX "ExternalCalendarEvent_connectionId_eventId_key" ON "ExternalCalendarEvent"("connectionId", "eventId");

-- AddForeignKey
ALTER TABLE "CalendarEventMapping" ADD CONSTRAINT "CalendarEventMapping_calendarConnectionId_fkey" FOREIGN KEY ("calendarConnectionId") REFERENCES "CalendarConnection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CalendarEventMapping" ADD CONSTRAINT "CalendarEventMapping_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CalendarSyncState" ADD CONSTRAINT "CalendarSyncState_connectionId_fkey" FOREIGN KEY ("connectionId") REFERENCES "CalendarConnection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CalendarWebhookChannel" ADD CONSTRAINT "CalendarWebhookChannel_connectionId_fkey" FOREIGN KEY ("connectionId") REFERENCES "CalendarConnection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CalendarSyncJob" ADD CONSTRAINT "CalendarSyncJob_connectionId_fkey" FOREIGN KEY ("connectionId") REFERENCES "CalendarConnection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CalendarSyncConflict" ADD CONSTRAINT "CalendarSyncConflict_connectionId_fkey" FOREIGN KEY ("connectionId") REFERENCES "CalendarConnection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CalendarSyncConflict" ADD CONSTRAINT "CalendarSyncConflict_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExternalCalendarEvent" ADD CONSTRAINT "ExternalCalendarEvent_connectionId_fkey" FOREIGN KEY ("connectionId") REFERENCES "CalendarConnection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

