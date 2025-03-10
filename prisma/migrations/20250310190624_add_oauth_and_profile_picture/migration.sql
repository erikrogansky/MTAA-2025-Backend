/*
  Warnings:

  - You are about to drop the column `oauthId` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `oauthProvider` on the `User` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "User_oauthId_key";

-- AlterTable
ALTER TABLE "User" DROP COLUMN "oauthId",
DROP COLUMN "oauthProvider",
ADD COLUMN     "profilePicture" TEXT,
ALTER COLUMN "password" DROP NOT NULL;

-- CreateTable
CREATE TABLE "OAuthAccount" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "provider" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,

    CONSTRAINT "OAuthAccount_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "OAuthAccount_provider_providerId_key" ON "OAuthAccount"("provider", "providerId");

-- AddForeignKey
ALTER TABLE "OAuthAccount" ADD CONSTRAINT "OAuthAccount_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
