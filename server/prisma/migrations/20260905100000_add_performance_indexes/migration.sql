-- CreateIndex: Add performance indexes on Property high-frequency query columns
CREATE INDEX IF NOT EXISTS "Property_city_idx" ON "Property"("city");
CREATE INDEX IF NOT EXISTS "Property_type_idx" ON "Property"("type");
CREATE INDEX IF NOT EXISTS "Property_status_idx" ON "Property"("status");
CREATE INDEX IF NOT EXISTS "Property_price_idx" ON "Property"("price");
CREATE INDEX IF NOT EXISTS "Property_featured_idx" ON "Property"("featured");
CREATE INDEX IF NOT EXISTS "Property_agentId_idx" ON "Property"("agentId");
CREATE INDEX IF NOT EXISTS "Property_createdAt_idx" ON "Property"("createdAt");
CREATE INDEX IF NOT EXISTS "Property_city_type_status_idx" ON "Property"("city", "type", "status");

-- CreateIndex: Add performance indexes on relations
CREATE INDEX IF NOT EXISTS "PropertyImage_propertyId_sortOrder_idx" ON "PropertyImage"("propertyId", "sortOrder");
CREATE INDEX IF NOT EXISTS "Review_propertyId_idx" ON "Review"("propertyId");
CREATE INDEX IF NOT EXISTS "TourBooking_userId_idx" ON "TourBooking"("userId");
CREATE INDEX IF NOT EXISTS "TourBooking_propertyId_idx" ON "TourBooking"("propertyId");
