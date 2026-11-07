-- Reviewed additive extension. Run only on the Studio database after a verified backup.
-- No existing row, column, credential or code is rewritten.
BEGIN;
SET LOCAL lock_timeout = '3s';
SET LOCAL statement_timeout = '30s';

-- CreateTable
CREATE TABLE "StudioPresence" (
    "id" TEXT NOT NULL,
    "codeId" TEXT NOT NULL,
    "browserHash" TEXT NOT NULL,
    "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastActiveAt" TIMESTAMP(3),
    "page" TEXT NOT NULL DEFAULT 'studio',
    "browserLabel" TEXT NOT NULL DEFAULT '',
    "blockedAt" TIMESTAMP(3),
    "endedAt" TIMESTAMP(3),

    CONSTRAINT "StudioPresence_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StudioLibraryLink" (
    "id" TEXT NOT NULL,
    "externalUserId" TEXT NOT NULL,
    "codeId" TEXT NOT NULL,
    "registeredAt" TIMESTAMP(3) NOT NULL,
    "trialEndsAt" TIMESTAMP(3) NOT NULL,
    "state" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "adminBlocked" BOOLEAN NOT NULL DEFAULT false,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StudioLibraryLink_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StudioIntegrationEvent" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "externalUserId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "bodyHash" TEXT NOT NULL,
    "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StudioIntegrationEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "StudioPresence_lastSeenAt_idx" ON "StudioPresence"("lastSeenAt");

-- CreateIndex
CREATE UNIQUE INDEX "StudioPresence_codeId_browserHash_key" ON "StudioPresence"("codeId", "browserHash");

-- CreateIndex
CREATE UNIQUE INDEX "StudioLibraryLink_externalUserId_key" ON "StudioLibraryLink"("externalUserId");

-- CreateIndex
CREATE UNIQUE INDEX "StudioLibraryLink_codeId_key" ON "StudioLibraryLink"("codeId");

-- CreateIndex
CREATE UNIQUE INDEX "StudioIntegrationEvent_eventId_key" ON "StudioIntegrationEvent"("eventId");

-- CreateIndex
CREATE UNIQUE INDEX "StudioIntegrationEvent_externalUserId_version_key" ON "StudioIntegrationEvent"("externalUserId", "version");

-- AddForeignKey
ALTER TABLE "StudioPresence" ADD CONSTRAINT "StudioPresence_codeId_fkey" FOREIGN KEY ("codeId") REFERENCES "AccessCode"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudioLibraryLink" ADD CONSTRAINT "StudioLibraryLink_codeId_fkey" FOREIGN KEY ("codeId") REFERENCES "AccessCode"("id") ON DELETE RESTRICT ON UPDATE CASCADE;


COMMIT;
