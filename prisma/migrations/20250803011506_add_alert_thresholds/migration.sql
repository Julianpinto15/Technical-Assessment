/*
  Warnings:

  - You are about to drop the column `alertThresholds` on the `Configuration` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."Configuration" DROP COLUMN "alertThresholds";

-- CreateTable
CREATE TABLE "public"."AlertThreshold" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "sku" TEXT,
    "category" TEXT,
    "metric" TEXT NOT NULL,
    "minThreshold" DOUBLE PRECISION NOT NULL,
    "maxThreshold" DOUBLE PRECISION NOT NULL,
    "condition" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AlertThreshold_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AlertThreshold_userId_sku_category_idx" ON "public"."AlertThreshold"("userId", "sku", "category");

-- CreateIndex
CREATE INDEX "Forecast_userId_sku_forecastDate_idx" ON "public"."Forecast"("userId", "sku", "forecastDate");

-- CreateIndex
CREATE INDEX "SalesData_userId_sku_date_idx" ON "public"."SalesData"("userId", "sku", "date");

-- AddForeignKey
ALTER TABLE "public"."AlertThreshold" ADD CONSTRAINT "AlertThreshold_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
