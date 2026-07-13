CREATE INDEX IF NOT EXISTS "User_createdAt_idx" ON "User"("createdAt");
CREATE INDEX IF NOT EXISTS "User_role_createdAt_idx" ON "User"("role", "createdAt");

CREATE INDEX IF NOT EXISTS "Tenant_createdAt_idx" ON "Tenant"("createdAt");
CREATE INDEX IF NOT EXISTS "Tenant_status_createdAt_idx" ON "Tenant"("status", "createdAt");

CREATE INDEX IF NOT EXISTS "Branch_tenantId_status_idx" ON "Branch"("tenantId", "status");
CREATE INDEX IF NOT EXISTS "Branch_status_createdAt_idx" ON "Branch"("status", "createdAt");

CREATE INDEX IF NOT EXISTS "VendorMembership_tenantId_createdAt_idx" ON "VendorMembership"("tenantId", "createdAt");

CREATE INDEX IF NOT EXISTS "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");
CREATE INDEX IF NOT EXISTS "AuditLog_actorRole_createdAt_idx" ON "AuditLog"("actorRole", "createdAt");
CREATE INDEX IF NOT EXISTS "AuditLog_resourceType_createdAt_idx" ON "AuditLog"("resourceType", "createdAt");

CREATE INDEX IF NOT EXISTS "Product_tenantId_isActive_idx" ON "Product"("tenantId", "isActive");
CREATE INDEX IF NOT EXISTS "Product_tenantId_branchId_isActive_idx" ON "Product"("tenantId", "branchId", "isActive");
CREATE INDEX IF NOT EXISTS "Product_tenantId_category_isActive_idx" ON "Product"("tenantId", "category", "isActive");

CREATE INDEX IF NOT EXISTS "Order_createdAt_idx" ON "Order"("createdAt");
CREATE INDEX IF NOT EXISTS "Order_userId_createdAt_idx" ON "Order"("userId", "createdAt");
CREATE INDEX IF NOT EXISTS "Order_status_createdAt_idx" ON "Order"("status", "createdAt");

CREATE INDEX IF NOT EXISTS "OrderItem_orderId_idx" ON "OrderItem"("orderId");
CREATE INDEX IF NOT EXISTS "OrderItem_productId_idx" ON "OrderItem"("productId");
