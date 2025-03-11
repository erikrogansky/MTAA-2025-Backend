-- CreateEnum
CREATE TYPE "DarkMode" AS ENUM ('y', 'n', 's');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "darkMode" "DarkMode" NOT NULL DEFAULT 's';
