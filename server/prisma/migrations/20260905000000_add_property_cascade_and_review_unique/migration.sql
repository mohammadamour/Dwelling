-- AlterTable: Add ON DELETE CASCADE to Property -> User (agent) relation
ALTER TABLE "Property" DROP CONSTRAINT IF EXISTS "Property_agentId_fkey";
ALTER TABLE "Property" ADD CONSTRAINT "Property_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateIndex: Add unique constraint on Review(reviewerId, propertyId) to prevent duplicate reviews
CREATE UNIQUE INDEX IF NOT EXISTS "Review_reviewerId_propertyId_key" ON "Review"("reviewerId", "propertyId");
