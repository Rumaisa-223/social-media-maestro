-- AlterTable
ALTER TABLE "Profile" ADD COLUMN     "avatarUrl" TEXT,
ADD COLUMN     "bio" TEXT;

-- CreateTable
CREATE TABLE "UserSettings" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "email_account_updates" BOOLEAN NOT NULL DEFAULT true,
    "email_marketing_news" BOOLEAN NOT NULL DEFAULT false,
    "email_product_updates" BOOLEAN NOT NULL DEFAULT true,
    "push_messages" BOOLEAN NOT NULL DEFAULT true,
    "push_engagement" BOOLEAN NOT NULL DEFAULT true,
    "push_scheduled_posts" BOOLEAN NOT NULL DEFAULT true,
    "auto_save_drafts" BOOLEAN NOT NULL DEFAULT true,
    "add_watermark" BOOLEAN NOT NULL DEFAULT false,
    "image_optimization" BOOLEAN NOT NULL DEFAULT true,
    "hashtags" JSONB,
    "hashtag_groups" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserSettings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "UserSettings_userId_key" ON "UserSettings"("userId");

-- AddForeignKey
ALTER TABLE "UserSettings" ADD CONSTRAINT "UserSettings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
