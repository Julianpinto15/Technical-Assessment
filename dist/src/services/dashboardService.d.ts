export declare const getDashboardSummary: (userId: string) => Promise<{
    totalSales: number;
    totalRevenue: number;
    totalProducts: number;
    totalCategories: number;
    salesChange: number;
    revenueChange: number;
}>;
export declare const getTrendsData: (userId: string) => Promise<{
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
//# sourceMappingURL=dashboardService.d.ts.map