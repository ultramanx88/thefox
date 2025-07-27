/**
 * Automated Reporting Service for Sales and User Data
 * Generates scheduled reports, dashboards, and business intelligence
 */
export interface ReportConfig {
    id: string;
    name: string;
    type: 'sales' | 'users' | 'orders' | 'products' | 'delivery' | 'financial' | 'custom';
    schedule: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly' | 'on-demand';
    format: 'json' | 'csv' | 'pdf' | 'excel';
    recipients: string[];
    enabled: boolean;
    filters?: Record<string, any>;
    customQuery?: string;
    lastGenerated?: Date;
    nextScheduled?: Date;
}
export interface ReportData {
    id: string;
    configId: string;
    name: string;
    type: string;
    generatedAt: Date;
    period: {
        startDate: Date;
        endDate: Date;
    };
    data: any;
    summary: {
        totalRecords: number;
        keyMetrics: Record<string, number>;
        insights: string[];
    };
    format: string;
    fileUrl?: string;
}
export interface DashboardWidget {
    id: string;
    title: string;
    type: 'chart' | 'metric' | 'table' | 'gauge' | 'map';
    chartType?: 'line' | 'bar' | 'pie' | 'area' | 'scatter';
    dataSource: string;
    query: string;
    refreshInterval: number;
    position: {
        x: number;
        y: number;
        width: number;
        height: number;
    };
    config: Record<string, any>;
    lastUpdated?: Date;
}
export interface Dashboard {
    id: string;
    name: string;
    description: string;
    widgets: DashboardWidget[];
    permissions: {
        viewers: string[];
        editors: string[];
    };
    isPublic: boolean;
    createdBy: string;
    createdAt: Date;
    updatedAt: Date;
}
export interface BusinessIntelligence {
    insights: Array<{
        type: 'trend' | 'anomaly' | 'opportunity' | 'risk';
        title: string;
        description: string;
        confidence: number;
        impact: 'low' | 'medium' | 'high';
        actionable: boolean;
        recommendations?: string[];
    }>;
    predictions: Array<{
        metric: string;
        predictedValue: number;
        confidence: number;
        timeframe: string;
        factors: string[];
    }>;
    alerts: Array<{
        type: 'performance' | 'anomaly' | 'threshold';
        severity: 'low' | 'medium' | 'high' | 'critical';
        message: string;
        affectedMetrics: string[];
        suggestedActions: string[];
    }>;
}
export declare class AutomatedReportingService {
    private static instance;
    private reportConfigs;
    private generatedReports;
    private dashboards;
    private scheduledJobs;
    private isInitialized;
    private constructor();
    static getInstance(): AutomatedReportingService;
    private initializeService;
    /**
     * Create a new report configuration
     */
    createReportConfig(config: Omit<ReportConfig, 'id' | 'lastGenerated' | 'nextScheduled'>): Promise<string>;
    /**
     * Update report configuration
     */
    updateReportConfig(configId: string, updates: Partial<ReportConfig>): Promise<void>;
    /**
     * Delete report configuration
     */
    deleteReportConfig(configId: string): Promise<void>;
    /**
     * Generate report on demand
     */
    generateReport(configId: string, customPeriod?: {
        startDate: Date;
        endDate: Date;
    }): Promise<ReportData>;
    /**
     * Generate sales report
     */
    private generateSalesReport;
    /**
     * Generate users report
     */
    private generateUsersReport;
    /**
     * Generate orders report
     */
    private generateOrdersReport;
    /**
     * Generate products report
     */
    private generateProductsReport;
    /**
     * Generate delivery report
     */
    private generateDeliveryReport;
    /**
     * Generate financial report
     */
    private generateFinancialReport;
    /**
     * Create dashboard
     */
    createDashboard(dashboard: Omit<Dashboard, 'id' | 'createdAt' | 'updatedAt'>): Promise<string>;
    /**
     * Update dashboard
     */
    updateDashboard(dashboardId: string, updates: Partial<Dashboard>): Promise<void>;
    /**
     * Get dashboard data
     */
    getDashboardData(dashboardId: string): Promise<{
        dashboard: Dashboard;
        widgetData: Record<string, any>;
    }>;
    /**
     * Generate business intelligence insights
     */
    generateBusinessIntelligence(): Promise<BusinessIntelligence>;
    /**
     * Load report configurations from Firestore
     */
    private loadReportConfigs;
    /**
     * Load dashboards from Firestore
     */
    private loadDashboards;
    /**
     * Setup default reports
     */
    private setupDefaultReports;
    /**
     * Schedule all reports
     */
    private scheduleAllReports;
    /**
     * Schedule a single report
     */
    private scheduleReport;
    /**
     * Unschedule a report
     */
    private unscheduleReport;
    /**
     * Calculate next schedule time
     */
    private calculateNextSchedule;
    /**
     * Calculate report period
     */
    private calculateReportPeriod;
    private createSalesSummary;
    private createUsersSummary;
    private createOrdersSummary;
    private createProductsSummary;
    private createDeliverySummary;
    private createFinancialSummary;
    private calculateOrderStatistics;
    private calculateProductPerformance;
    private calculateDeliveryStatistics;
    private generateWidgetData;
    private generateInsights;
    private generatePredictions;
    private generateAlerts;
    private persistReportConfig;
    private persistReport;
    private sendReportToRecipients;
    private generateReportId;
    private generateDashboardId;
    /**
     * Get all report configurations
     */
    getReportConfigs(): ReportConfig[];
    /**
     * Get generated reports
     */
    getGeneratedReports(limit?: number): ReportData[];
    /**
     * Get dashboards
     */
    getDashboards(): Dashboard[];
    /**
     * Get service status
     */
    getServiceStatus(): {
        isInitialized: boolean;
        totalConfigs: number;
        totalReports: number;
        totalDashboards: number;
        scheduledJobs: number;
    };
}
export declare const automatedReportingService: AutomatedReportingService;
