/*
  Warnings:

  - The `confidenceLevel` column on the `Configuration` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `forecastHorizon` column on the `Configuration` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to alter the column `sku` on the `SalesData` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(20)`.
  - Added the required column `seasonalFactor` to the `Forecast` table without a default value. This is not possible if the table is not empty.
  - Added the required column `trendComponent` to the `Forecast` table without a default value. This is not possible if the table is not empty.
  - Added the required column `category` to the `SalesData` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."Configuration" DROP COLUMN "confidenceLevel",
ADD COLUMN     "confidenceLevel" DOUBLE PRECISION[],
DROP COLUMN "forecastHorizon",
ADD COLUMN     "forecastHorizon" INTEGER[];

-- AlterTable
ALTER TABLE "public"."Forecast" ADD COLUMN     "seasonalFactor" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "trendComponent" DOUBLE PRECISION NOT NULL,
ALTER COLUMN "confidenceLevel" SET DATA TYPE DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "public"."SalesData" ADD COLUMN     "category" TEXT NOT NULL,
ALTER COLUMN "sku" SET DATA TYPE VARCHAR(20);
