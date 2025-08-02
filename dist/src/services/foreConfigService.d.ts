import { AlertThresholdsInterface } from "../interface/AlertThresholdsInterface";
import { NotificationsInterface } from "../interface/NotificationsInterface";
export declare function upsertForecastConfig(userId: string, forecastHorizon: number[], confidenceLevel: number[], alertThresholds?: AlertThresholdsInterface, notificationSettings?: NotificationsInterface): Promise<{
    id: string;
    userId: string;
    forecastHorizon: number[];
    alertThresholds: import("../generated/prisma/runtime/library").JsonValue;
    notificationSettings: import("../generated/prisma/runtime/library").JsonValue;
    confidenceLevel: number[];
}>;
//# sourceMappingURL=foreConfigService.d.ts.map