-- AlterTable
ALTER TABLE "users" ADD COLUMN     "email_verification_otp_expires_at" TIMESTAMP(6),
ADD COLUMN     "email_verification_otp_hash" TEXT,
ADD COLUMN     "email_verified" BOOLEAN NOT NULL DEFAULT false;
