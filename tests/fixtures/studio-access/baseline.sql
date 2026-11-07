-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "WhatsAppLink" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "message" TEXT NOT NULL DEFAULT '',
    "title" TEXT NOT NULL DEFAULT '',
    "clicks" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WhatsAppLink_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AccessCode" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "note" TEXT NOT NULL DEFAULT '',
    "clientName" TEXT NOT NULL DEFAULT '',
    "clientType" TEXT NOT NULL DEFAULT 'library',
    "browserHash" TEXT,
    "sessionHash" TEXT,
    "sessionExpiresAt" TIMESTAMP(3),
    "maxUses" INTEGER NOT NULL DEFAULT 1,
    "accessMode" TEXT NOT NULL DEFAULT 'individual',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AccessCode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AccessCodeUse" (
    "id" TEXT NOT NULL,
    "codeId" TEXT NOT NULL,
    "deviceId" TEXT NOT NULL,
    "usedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sessionHash" TEXT,
    "sessionExpiresAt" TIMESTAMP(3),

    CONSTRAINT "AccessCodeUse_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Visit" (
    "id" TEXT NOT NULL,
    "day" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "sid" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Visit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SiteConfig" (
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SiteConfig_pkey" PRIMARY KEY ("key")
);

-- CreateTable
CREATE TABLE "MockupSceneItem" (
    "id" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "tags" TEXT NOT NULL DEFAULT '[]',
    "status" TEXT NOT NULL DEFAULT 'draft',
    "surface" TEXT,
    "imageBytes" BYTEA NOT NULL,
    "thumbnailBytes" BYTEA,
    "mimeType" TEXT NOT NULL,
    "width" INTEGER NOT NULL,
    "height" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MockupSceneItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CreativeAsset" (
    "id" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'Geral',
    "tags" TEXT NOT NULL DEFAULT '[]',
    "status" TEXT NOT NULL DEFAULT 'published',
    "order" INTEGER NOT NULL DEFAULT 0,
    "mimeType" TEXT NOT NULL,
    "storageKey" TEXT NOT NULL,
    "bytes" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CreativeAsset_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "WhatsAppLink_slug_key" ON "WhatsAppLink"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "AccessCode_code_key" ON "AccessCode"("code");

-- CreateIndex
CREATE INDEX "AccessCode_sessionHash_idx" ON "AccessCode"("sessionHash");

-- CreateIndex
CREATE INDEX "AccessCodeUse_usedAt_idx" ON "AccessCodeUse"("usedAt");

-- CreateIndex
CREATE INDEX "AccessCodeUse_sessionHash_idx" ON "AccessCodeUse"("sessionHash");

-- CreateIndex
CREATE UNIQUE INDEX "AccessCodeUse_codeId_deviceId_key" ON "AccessCodeUse"("codeId", "deviceId");

-- CreateIndex
CREATE INDEX "Visit_day_idx" ON "Visit"("day");

-- CreateIndex
CREATE INDEX "Visit_day_path_idx" ON "Visit"("day", "path");

-- CreateIndex
CREATE INDEX "MockupSceneItem_kind_status_category_createdAt_idx" ON "MockupSceneItem"("kind", "status", "category", "createdAt");

-- CreateIndex
CREATE INDEX "MockupSceneItem_kind_status_createdAt_idx" ON "MockupSceneItem"("kind", "status", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "CreativeAsset_storageKey_key" ON "CreativeAsset"("storageKey");

-- CreateIndex
CREATE INDEX "CreativeAsset_kind_status_category_order_idx" ON "CreativeAsset"("kind", "status", "category", "order");

-- CreateIndex
CREATE INDEX "CreativeAsset_status_createdAt_idx" ON "CreativeAsset"("status", "createdAt");

-- AddForeignKey
ALTER TABLE "AccessCodeUse" ADD CONSTRAINT "AccessCodeUse_codeId_fkey" FOREIGN KEY ("codeId") REFERENCES "AccessCode"("id") ON DELETE CASCADE ON UPDATE CASCADE;
