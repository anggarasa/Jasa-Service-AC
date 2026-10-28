-- CreateEnum
CREATE TYPE "AuthAuditEventType" AS ENUM ('LOGIN_SUCCESS', 'LOGIN_FAILED', 'TOKEN_REFRESH', 'TOKEN_REUSE_DETECTED', 'LOGOUT', 'LOGOUT_ALL', 'SESSION_REVOKED', 'PASSWORD_CHANGED', 'ACCESS_DENIED', 'ACCOUNT_DISABLED');

-- DropForeignKey
ALTER TABLE "Session" DROP CONSTRAINT IF EXISTS "Session_userId_fkey";

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "lastLoginAt" TIMESTAMP(3),
ADD COLUMN     "passwordChangedAt" TIMESTAMP(3),
ADD COLUMN     "tokenVersion" INTEGER NOT NULL DEFAULT 1;

-- DropTable
DROP TABLE IF EXISTS "Session";

-- CreateTable
CREATE TABLE "AuthSession" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "familyId" TEXT NOT NULL,
    "userAgent" TEXT,
    "ipAddress" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastUsedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "absoluteExpiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "revokedReason" TEXT,

    CONSTRAINT "AuthSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RefreshTokenRecord" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "jti" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "issuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "consumedAt" TIMESTAMP(3),
    "replacedByJti" TEXT,
    "revokedAt" TIMESTAMP(3),

    CONSTRAINT "RefreshTokenRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuthAuditLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "sessionId" TEXT,
    "eventType" "AuthAuditEventType" NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuthAuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RateLimitRecord" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "points" INTEGER NOT NULL DEFAULT 0,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RateLimitRecord_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AuthSession_userId_revokedAt_idx" ON "AuthSession"("userId", "revokedAt");

-- CreateIndex
CREATE INDEX "AuthSession_familyId_idx" ON "AuthSession"("familyId");

-- CreateIndex
CREATE UNIQUE INDEX "RefreshTokenRecord_jti_key" ON "RefreshTokenRecord"("jti");

-- CreateIndex
CREATE UNIQUE INDEX "RefreshTokenRecord_tokenHash_key" ON "RefreshTokenRecord"("tokenHash");

-- CreateIndex
CREATE INDEX "RefreshTokenRecord_sessionId_consumedAt_idx" ON "RefreshTokenRecord"("sessionId", "consumedAt");

-- CreateIndex
CREATE INDEX "RefreshTokenRecord_tokenHash_idx" ON "RefreshTokenRecord"("tokenHash");

-- CreateIndex
CREATE INDEX "AuthAuditLog_userId_eventType_idx" ON "AuthAuditLog"("userId", "eventType");

-- CreateIndex
CREATE INDEX "AuthAuditLog_createdAt_idx" ON "AuthAuditLog"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "RateLimitRecord_key_key" ON "RateLimitRecord"("key");

-- CreateIndex
CREATE INDEX "RateLimitRecord_key_expiresAt_idx" ON "RateLimitRecord"("key", "expiresAt");

-- AddForeignKey
ALTER TABLE "AuthSession" ADD CONSTRAINT "AuthSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RefreshTokenRecord" ADD CONSTRAINT "RefreshTokenRecord_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "AuthSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuthAuditLog" ADD CONSTRAINT "AuthAuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuthAuditLog" ADD CONSTRAINT "AuthAuditLog_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "AuthSession"("id") ON DELETE SET NULL ON UPDATE CASCADE;
