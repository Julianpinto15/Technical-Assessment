/*
  Warnings:

  - A unique constraint covering the columns `[userId,metric,sku,category]` on the table `AlertThreshold` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "AlertThreshold_userId_metric_sku_category_key" ON "public"."AlertThreshold"("userId", "metric", "sku", "category");
