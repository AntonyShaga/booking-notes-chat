-- AlterTable
ALTER TABLE "users" ALTER COLUMN "activeRefreshTokens" SET DEFAULT ARRAY[]::TEXT[];
