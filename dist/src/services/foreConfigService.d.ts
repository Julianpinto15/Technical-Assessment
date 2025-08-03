import { AlertThresholdsInterface } from "../interface/AlertThresholdsInterface";
import { NotificationsInterface } from "../interface/NotificationsInterface";
export declare function upsertForecastConfig(userId: string, forecastHorizon: number[], confidenceLevel: number[], alertThresholds?: AlertThresholdsInterface, notificationSettings?: NotificationsInterface): Promise<{
    id: string;
    userId: string;
    confidenceLevel: number[];
    forecastHorizon: number[];
    notificationSettings: import("../generated/prisma/runtime/library").JsonValue;
}>;
//# sourceMappingURL=foreConfigService.d.ts.map