-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "uniShare";

-- CreateEnum
CREATE TYPE "uniShare"."ItemStatus" AS ENUM ('AVAILABLE', 'RENTED', 'MAINTENANCE', 'REMOVED');

-- CreateEnum
CREATE TYPE "uniShare"."OwnerType" AS ENUM ('PLATFORM', 'USER');

-- CreateEnum
CREATE TYPE "uniShare"."PaymentStatus" AS ENUM ('PENDING', 'SUCCESS', 'FAILED');

-- CreateEnum
CREATE TYPE "uniShare"."PaymentType" AS ENUM ('RENTAL_FEE', 'DEPOSIT', 'REFUND');

-- CreateEnum
CREATE TYPE "uniShare"."RentalStatus" AS ENUM ('PENDING', 'CONFIRMED', 'ACTIVE', 'RETURNED', 'OVERDUE', 'CANCELLED');

-- CreateEnum
CREATE TYPE "uniShare"."Role" AS ENUM ('STUDENT', 'ADMIN');

-- CreateTable
CREATE TABLE "uniShare"."EndUsers" (
    "id" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "uniShare"."Role" NOT NULL DEFAULT 'STUDENT',
    "isIdVerified" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EndUsers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "uniShare"."identity_verifications" (
    "id" TEXT NOT NULL,
    "EndUserId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "externalId" TEXT NOT NULL,
    "verifiedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "identity_verifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "uniShare"."items" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT NOT NULL,
    "ownerType" "uniShare"."OwnerType" NOT NULL,
    "ownerId" TEXT,
    "status" "uniShare"."ItemStatus" NOT NULL DEFAULT 'AVAILABLE',
    "imageUrl" TEXT,
    "pricePerDay" DOUBLE PRECISION NOT NULL,
    "deposit" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "uniShare"."payments" (
    "id" TEXT NOT NULL,
    "rentalId" TEXT NOT NULL,
    "EndUserId" TEXT NOT NULL,
    "txRef" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "type" "uniShare"."PaymentType" NOT NULL,
    "status" "uniShare"."PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "uniShare"."refresh_tokens" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "EndUserId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revoked" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "refresh_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "uniShare"."rental_status_logs" (
    "id" TEXT NOT NULL,
    "rentalId" TEXT NOT NULL,
    "oldStatus" "uniShare"."RentalStatus",
    "newStatus" "uniShare"."RentalStatus" NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "rental_status_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "uniShare"."rentals" (
    "id" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "renterId" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "totalPrice" DOUBLE PRECISION NOT NULL,
    "status" "uniShare"."RentalStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "rentals_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "EndUsers_email_key" ON "uniShare"."EndUsers"("email" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "identity_verifications_EndUserId_key" ON "uniShare"."identity_verifications"("EndUserId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "payments_txRef_key" ON "uniShare"."payments"("txRef" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "refresh_tokens_token_key" ON "uniShare"."refresh_tokens"("token" ASC);

-- AddForeignKey
ALTER TABLE "uniShare"."identity_verifications" ADD CONSTRAINT "identity_verifications_EndUserId_fkey" FOREIGN KEY ("EndUserId") REFERENCES "uniShare"."EndUsers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "uniShare"."items" ADD CONSTRAINT "items_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "uniShare"."EndUsers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "uniShare"."payments" ADD CONSTRAINT "payments_EndUserId_fkey" FOREIGN KEY ("EndUserId") REFERENCES "uniShare"."EndUsers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "uniShare"."payments" ADD CONSTRAINT "payments_rentalId_fkey" FOREIGN KEY ("rentalId") REFERENCES "uniShare"."rentals"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "uniShare"."refresh_tokens" ADD CONSTRAINT "refresh_tokens_EndUserId_fkey" FOREIGN KEY ("EndUserId") REFERENCES "uniShare"."EndUsers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "uniShare"."rental_status_logs" ADD CONSTRAINT "rental_status_logs_rentalId_fkey" FOREIGN KEY ("rentalId") REFERENCES "uniShare"."rentals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "uniShare"."rentals" ADD CONSTRAINT "rentals_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "uniShare"."items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "uniShare"."rentals" ADD CONSTRAINT "rentals_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "uniShare"."EndUsers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "uniShare"."rentals" ADD CONSTRAINT "rentals_renterId_fkey" FOREIGN KEY ("renterId") REFERENCES "uniShare"."EndUsers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

