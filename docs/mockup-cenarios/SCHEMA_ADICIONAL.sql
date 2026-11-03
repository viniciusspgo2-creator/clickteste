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

-- CreateIndex
CREATE INDEX "MockupSceneItem_kind_status_category_createdAt_idx" ON "MockupSceneItem"("kind", "status", "category", "createdAt");

-- CreateIndex
CREATE INDEX "MockupSceneItem_kind_status_createdAt_idx" ON "MockupSceneItem"("kind", "status", "createdAt");
