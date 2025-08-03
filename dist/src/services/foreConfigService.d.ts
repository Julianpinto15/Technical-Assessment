import { AlertThresholdsInterface } from "../interface/AlertThresholdsInterface";
import { NotificationsInterface } from "../interface/NotificationsInterface";
interface UpsertForecastConfigParams {
    userId: string;
    forecastHorizon: number[];
    confidenceLevel: number[];
    alertThresholds?: AlertThresholdsInterface;
    notificationSettings?: NotificationsInterface;
}
export declare function upsertForecastConfig(params: UpsertForecastConfigParams): Promise<any>;
export declare function upsertForecastConfigLegacy(userId: string, forecastHorizon: number[], confidenceLevel: number[], alertThresholds?: AlertThresholdsInterface, notificationSettings?: NotificationsInterface): Promise<any>;
export {};
//# sourceMappingURL=foreConfigService.d.ts.map