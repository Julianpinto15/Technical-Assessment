export declare const getDashboardSummary: (userId: string, startDateParam?: string, endDateParam?: string) => Promise<{
    totalSales: number;
    totalRevenue: number;
    totalProducts: number;
    totalCategories: number;
    salesChange: number;
    revenueChange: number;
}>;
export declare const getTrendsData: (userId: string, startDateParam?: string, endDateParam?: string) => Promise<{
    labels: string[];
    sales: number[];
    revenue: number[];
}>;
export declare const getNotifications: (userId: string) => Promise<{
    id: string;
    message: string;
    timestamp: string;
    type: string;
}[]>;
export declare const getDashboardStats: (userId: string) => Promise<{
    userCount: number;
    forecastCount: number;
    alertCount: number;
    avgPrecision: number;
}>;
//# sourceMappingURL=dashboardService.d.ts.map