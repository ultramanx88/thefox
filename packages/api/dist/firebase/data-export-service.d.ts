/**
 * Data Export Service for Compliance and Audit Trails
 * Handles GDPR compliance, data export, audit logging, and security trails
 */
export interface ExportRequest {
    id: string;
    type: 'user_data' | 'analytics' | 'audit_logs' | 'security_logs' | 'business_data' | 'full_export';
    requestedBy: string;
    requestedAt: Date;
    status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
    format: 'json' | 'csv' | 'xml' | 'pdf';
    filters?: {
        userId?: string;
        startDate?: Date;
        endDate?: Date;
        collections?: string[];
        includePersonalData?: boolean;
        includeSensitiveData?: boolean;
    };
    reason: 'gdpr_request' | 'audit' | 'compliance' | 'backup' | 'migration' | 'investigation';
    progress: number;
    estimatedCompletion?: Date;
    completedAt?: Date;
    downloadUrl?: string;
    expiresAt?: Date;
    metadata?: Record<string, any>;
}
export interface ExportedData {
    exportId: string;
    type: string;
    generatedAt: Date;
    requestedBy: string;
    dataSize: number;
    recordCount: number;
    collections: string[];
    data: {
        userData?: any;
        analytics?: any;
        auditLogs?: any;
        securityLogs?: any;
        businessData?: any;
    };
    metadata: {
        version: string;
        format: string;
        encryption: boolean;
        checksums: Record<string, string>;
    };
}
export interface AuditTrail {
    id: string;
    timestamp: Date;
    userId: string;
    userRole: string;
    action: string;
    resource: string;
    resourceId?: string;
    ipAddress: string;
    userAgent: string;
    sessionId: string;
    success: boolean;
    changes?: {
        before?: any;
        after?: any;
        fields: string[];
    };
    metadata?: Record<string, any>;
    severity: 'low' | 'medium' | 'high' | 'critical';
    category: 'authentication' | 'authorization' | 'data_access' | 'data_modification' | 'system' | 'security';
}
export interface ComplianceReport {
    id: string;
    type: 'gdpr' | 'ccpa' | 'hipaa' | 'sox' | 'custom';
    generatedAt: Date;
    period: {
        startDate: Date;
        endDate: Date;
    };
    summary: {
        totalDataRequests: number;
        completedRequests: number;
        pendingRequests: number;
        averageResponseTime: number;
        dataBreaches: number;
        securityIncidents: number;
    };
    details: {
        dataRequests: ExportRequest[];
        auditTrails: AuditTrail[];
        securityEvents: any[];
        complianceViolations: any[];
    };
    recommendations: string[];
    status: 'draft' | 'final' | 'submitted';
}
export declare class DataExportService {
    private static instance;
    private exportRequests;
    private auditTrails;
    private complianceReports;
    private processingQueue;
    private isProcessing;
    private constructor();
    static getInstance(): DataExportService;
    private initializeService;
    /**
     * Create data export request
     */
    createExportRequest(type: ExportRequest['type'], requestedBy: string, reason: ExportRequest['reason'], format?: ExportRequest['format'], filters?: ExportRequest['filters']): Promise<string>;
    /**
     * Get export request status
     */
    getExportRequest(exportId: string): ExportRequest | null;
    /**
     * Cancel export request
     */
    cancelExportRequest(exportId: string, cancelledBy: string): Promise<void>;
    /**
     * Process next export request in queue
     */
    private processNextRequest;
    /**
     * Process export based on type
     */
    private processExportByType;
    /**
     * Export user data for GDPR compliance
     */
    private exportUserData;
    /**
     * Export analytics data
     */
    private exportAnalyticsData;
    /**
     * Export audit logs
     */
    private exportAuditLogs;
    /**
     * Export security logs
     */
    private exportSecurityLogs;
    /**
     * Export business data
     */
    private exportBusinessData;
    /**
     * Export all data (full export)
     */
    private exportAllData;
    /**
     * Log audit trail
     */
    logAuditTrail(auditData: Omit<AuditTrail, 'id' | 'timestamp' | 'ipAddress' | 'userAgent' | 'sessionId'>): Promise<void>;
    /**
     * Get audit trails
     */
    getAuditTrails(filters?: {
        userId?: string;
        startDate?: Date;
        endDate?: Date;
        action?: string;
        resource?: string;
    }): AuditTrail[];
    /**
     * Generate compliance report
     */
    generateComplianceReport(type: ComplianceReport['type'], startDate: Date, endDate: Date): Promise<ComplianceReport>;
    /**
     * Start processing queue
     */
    private startProcessingQueue;
    /**
     * Start periodic cleanup
     */
    private startPeriodicCleanup;
    /**
     * Clean up expired exports
     */
    private cleanupExpiredExports;
    /**
     * Clean up old audit trails
     */
    private cleanupOldAuditTrails;
    /**
     * Load export requests from Firestore
     */
    private loadExportRequests;
    /**
     * Load audit trails from Firestore
     */
    private loadAuditTrails;
    /**
     * Update export progress
     */
    private updateProgress;
    /**
     * Calculate estimated completion time
     */
    private calculateEstimatedCompletion;
    /**
     * Generate download URL
     */
    private generateDownloadUrl;
    /**
     * Calculate data size
     */
    private calculateDataSize;
    /**
     * Calculate record count
     */
    private calculateRecordCount;
    /**
     * Generate compliance recommendations
     */
    private generateComplianceRecommendations;
    private getClientIP;
    private getUserAgent;
    private getSessionId;
    private persistExportRequest;
    private generateExportId;
    private generateAuditId;
    private generateReportId;
    /**
     * Get export requests
     */
    getExportRequests(userId?: string): ExportRequest[];
    /**
     * Get compliance reports
     */
    getComplianceReports(): ComplianceReport[];
    /**
     * Get service status
     */
    getServiceStatus(): {
        totalExportRequests: number;
        pendingRequests: number;
        processingRequests: number;
        completedRequests: number;
        totalAuditTrails: number;
        totalComplianceReports: number;
        isProcessing: boolean;
        queueLength: number;
    };
}
export declare const dataExportService: DataExportService;
