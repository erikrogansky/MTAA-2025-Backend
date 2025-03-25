-- CreateTable
CREATE TABLE "Recipe" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "tags" TEXT NOT NULL,
    "ingredients" TEXT NOT NULL,
    "instructions" TEXT NOT NULL,
    "isPublic" BOOLEAN NOT NULL,
    "coverPhoto" TEXT,
    "description" TEXT NOT NULL,
    "details" TEXT,
    "userId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Recipe_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Recipe" ADD CONSTRAINT "Recipe_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
