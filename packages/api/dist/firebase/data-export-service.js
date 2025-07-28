"use strict";
/**
 * Data Export Service for Compliance and Audit Trails
 * Handles GDPR compliance, data export, audit logging, and security trails
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.dataExportService = exports.DataExportService = void 0;
const analytics_service_1 = require("./analytics-service");
const logger_1 = require("./logger");
const firestore_1 = require("./firestore");
// ===========================================
// DATA EXPORT SERVICE
// ===========================================
class DataExportService {
    constructor() {
        this.exportRequests = new Map();
        this.auditTrails = new Map();
        this.complianceReports = new Map();
        this.processingQueue = [];
        this.isProcessing = false;
        this.initializeService();
    }
    static getInstance() {
        if (!DataExportService.instance) {
            DataExportService.instance = new DataExportService();
        }
        return DataExportService.instance;
    }
    // ===========================================
    // INITIALIZATION
    // ===========================================
    async initializeService() {
        try {
            // Load existing export requests
            await this.loadExportRequests();
            // Load audit trails
            await this.loadAuditTrails();
            // Start processing queue
            this.startProcessingQueue();
            // Set up periodic cleanup
            this.startPeriodicCleanup();
            logger_1.firebaseLogger.info(logger_1.LogCategory.SYSTEM, 'data_export_init', 'Data Export Service initialized');
        }
        catch (error) {
            console.error('Failed to initialize Data Export Service:', error);
            logger_1.firebaseLogger.error(logger_1.LogCategory.SYSTEM, 'data_export_init', 'Failed to initialize Data Export Service', error);
        }
    }
    // ===========================================
    // EXPORT REQUEST MANAGEMENT
    // ===========================================
    /**
     * Create data export request
     */
    async createExportRequest(type, requestedBy, reason, format = 'json', filters) {
        const exportRequest = {
            id: this.generateExportId(),
            type,
            requestedBy,
            requestedAt: new Date(),
            status: 'pending',
            format,
            filters,
            reason,
            progress: 0,
            estimatedCompletion: this.calculateEstimatedCompletion(type),
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        };
        this.exportRequests.set(exportRequest.id, exportRequest);
        // Add to processing queue
        this.processingQueue.push(exportRequest.id);
        // Persist to Firestore
        await this.persistExportRequest(exportRequest);
        // Log audit trail
        await this.logAuditTrail({
            userId: requestedBy,
            userRole: 'user', // Would be determined from user data
            action: 'export_request_created',
            resource: 'data_export',
            resourceId: exportRequest.id,
            success: true,
            category: 'data_access',
            severity: 'medium',
            metadata: { type, reason, format },
        });
        logger_1.firebaseLogger.info(logger_1.LogCategory.SYSTEM, 'export_request_created', `Data export request created: ${type}`, { exportId: exportRequest.id, requestedBy, reason });
        // Start processing if not already running
        if (!this.isProcessing) {
            this.processNextRequest();
        }
        return exportRequest.id;
    }
    /**
     * Get export request status
     */
    getExportRequest(exportId) {
        return this.exportRequests.get(exportId) || null;
    }
    /**
     * Cancel export request
     */
    async cancelExportRequest(exportId, cancelledBy) {
        const request = this.exportRequests.get(exportId);
        if (!request) {
            throw new Error(`Export request not found: ${exportId}`);
        }
        if (request.status === 'completed') {
            throw new Error('Cannot cancel completed export request');
        }
        request.status = 'cancelled';
        // Remove from processing queue
        const queueIndex = this.processingQueue.indexOf(exportId);
        if (queueIndex > -1) {
            this.processingQueue.splice(queueIndex, 1);
        }
        // Persist changes
        await this.persistExportRequest(request);
        // Log audit trail
        await this.logAuditTrail({
            userId: cancelledBy,
            userRole: 'user',
            action: 'export_request_cancelled',
            resource: 'data_export',
            resourceId: exportId,
            success: true,
            category: 'data_access',
            severity: 'low',
        });
        logger_1.firebaseLogger.info(logger_1.LogCategory.SYSTEM, 'export_request_cancelled', `Export request cancelled: ${exportId}`, { cancelledBy });
    }
    // ===========================================
    // DATA EXPORT PROCESSING
    // ===========================================
    /**
     * Process next export request in queue
     */
    async processNextRequest() {
        if (this.isProcessing || this.processingQueue.length === 0) {
            return;
        }
        this.isProcessing = true;
        const exportId = this.processingQueue.shift();
        const request = this.exportRequests.get(exportId);
        if (!request || request.status !== 'pending') {
            this.isProcessing = false;
            this.processNextRequest(); // Process next request
            return;
        }
        try {
            // Update status to processing
            request.status = 'processing';
            request.progress = 0;
            await this.persistExportRequest(request);
            logger_1.firebaseLogger.info(logger_1.LogCategory.SYSTEM, 'export_processing_started', `Started processing export request: ${request.type}`, { exportId });
            // Process the export based on type
            const exportedData = await this.processExportByType(request);
            // Generate download URL (would integrate with storage service)
            const downloadUrl = await this.generateDownloadUrl(exportedData, request.format);
            // Update request as completed
            request.status = 'completed';
            request.progress = 100;
            request.completedAt = new Date();
            request.downloadUrl = downloadUrl;
            await this.persistExportRequest(request);
            // Log completion
            await this.logAuditTrail({
                userId: request.requestedBy,
                userRole: 'user',
                action: 'export_request_completed',
                resource: 'data_export',
                resourceId: exportId,
                success: true,
                category: 'data_access',
                severity: 'medium',
                metadata: {
                    type: request.type,
                    recordCount: exportedData.recordCount,
                    dataSize: exportedData.dataSize,
                },
            });
            logger_1.firebaseLogger.info(logger_1.LogCategory.SYSTEM, 'export_processing_completed', `Export request completed: ${request.type}`, {
                exportId,
                recordCount: exportedData.recordCount,
                dataSize: exportedData.dataSize
            });
        }
        catch (error) {
            // Update request as failed
            request.status = 'failed';
            request.metadata = { error: error.message };
            await this.persistExportRequest(request);
            // Log failure
            await this.logAuditTrail({
                userId: request.requestedBy,
                userRole: 'user',
                action: 'export_request_failed',
                resource: 'data_export',
                resourceId: exportId,
                success: false,
                category: 'data_access',
                severity: 'high',
                metadata: { error: error.message },
            });
            logger_1.firebaseLogger.error(logger_1.LogCategory.SYSTEM, 'export_processing_failed', `Export request failed: ${request.type}`, error, { exportId });
        }
        this.isProcessing = false;
        // Process next request in queue
        setTimeout(() => {
            this.processNextRequest();
        }, 1000);
    }
    /**
     * Process export based on type
     */
    async processExportByType(request) {
        const exportedData = {
            exportId: request.id,
            type: request.type,
            generatedAt: new Date(),
            requestedBy: request.requestedBy,
            dataSize: 0,
            recordCount: 0,
            collections: [],
            data: {},
            metadata: {
                version: '1.0',
                format: request.format,
                encryption: false,
                checksums: {},
            },
        };
        switch (request.type) {
            case 'user_data':
                exportedData.data.userData = await this.exportUserData(request);
                break;
            case 'analytics':
                exportedData.data.analytics = await this.exportAnalyticsData(request);
                break;
            case 'audit_logs':
                exportedData.data.auditLogs = await this.exportAuditLogs(request);
                break;
            case 'security_logs':
                exportedData.data.securityLogs = await this.exportSecurityLogs(request);
                break;
            case 'business_data':
                exportedData.data.businessData = await this.exportBusinessData(request);
                break;
            case 'full_export':
                exportedData.data = await this.exportAllData(request);
                break;
            default:
                throw new Error(`Unsupported export type: ${request.type}`);
        }
        // Calculate data size and record count
        exportedData.dataSize = this.calculateDataSize(exportedData.data);
        exportedData.recordCount = this.calculateRecordCount(exportedData.data);
        return exportedData;
    }
    // ===========================================
    // SPECIFIC EXPORT METHODS
    // ===========================================
    /**
     * Export user data for GDPR compliance
     */
    async exportUserData(request) {
        const userId = request.filters?.userId;
        if (!userId) {
            throw new Error('User ID required for user data export');
        }
        // Update progress
        await this.updateProgress(request.id, 10);
        // Get user profile
        const userProfile = await firestore_1.FirestoreService.read('users', userId);
        // Update progress
        await this.updateProgress(request.id, 30);
        // Get user orders
        const userOrders = await firestore_1.FirestoreService.query('orders', [{ field: 'userId', operator: '==', value: userId }]);
        // Update progress
        await this.updateProgress(request.id, 50);
        // Get user analytics
        const userAnalytics = analytics_service_1.firebaseAnalyticsService.exportUserData(userId);
        // Update progress
        await this.updateProgress(request.id, 70);
        // Get user audit logs
        const userAuditLogs = Array.from(this.auditTrails.values()).filter(trail => trail.userId === userId);
        // Update progress
        await this.updateProgress(request.id, 90);
        return {
            profile: userProfile,
            orders: userOrders,
            analytics: userAnalytics,
            auditLogs: userAuditLogs,
            exportedAt: new Date(),
        };
    }
    /**
     * Export analytics data
     */
    async exportAnalyticsData(request) {
        const { startDate, endDate } = request.filters || {};
        if (!startDate || !endDate) {
            throw new Error('Start date and end date required for analytics export');
        }
        // Update progress
        await this.updateProgress(request.id, 20);
        const analyticsData = analytics_service_1.firebaseAnalyticsService.exportAnalyticsData(startDate, endDate, request.format);
        // Update progress
        await this.updateProgress(request.id, 80);
        return analyticsData;
    }
    /**
     * Export audit logs
     */
    async exportAuditLogs(request) {
        const { startDate, endDate } = request.filters || {};
        let auditLogs = Array.from(this.auditTrails.values());
        if (startDate && endDate) {
            auditLogs = auditLogs.filter(log => log.timestamp >= startDate && log.timestamp <= endDate);
        }
        // Update progress
        await this.updateProgress(request.id, 50);
        // Also get audit logs from Firestore
        const firestoreAuditLogs = await firestore_1.FirestoreService.query('auditLogs');
        // Update progress
        await this.updateProgress(request.id, 80);
        return {
            memoryLogs: auditLogs,
            persistedLogs: firestoreAuditLogs,
            exportedAt: new Date(),
        };
    }
    /**
     * Export security logs
     */
    async exportSecurityLogs(request) {
        const { startDate, endDate } = request.filters || {};
        // Get security logs from logger
        const securityLogs = logger_1.firebaseLogger.getRecentSecurityLogs(1000);
        let filteredLogs = securityLogs;
        if (startDate && endDate) {
            filteredLogs = securityLogs.filter(log => log.timestamp >= startDate && log.timestamp <= endDate);
        }
        // Update progress
        await this.updateProgress(request.id, 50);
        // Get security logs from Firestore
        const firestoreSecurityLogs = await firestore_1.FirestoreService.query('securityLogs');
        // Update progress
        await this.updateProgress(request.id, 80);
        return {
            memoryLogs: filteredLogs,
            persistedLogs: firestoreSecurityLogs,
            exportedAt: new Date(),
        };
    }
    /**
     * Export business data
     */
    async exportBusinessData(request) {
        const collections = request.filters?.collections || [
            'orders', 'products', 'markets', 'users', 'deliveries'
        ];
        const businessData = {};
        const progressStep = 80 / collections.length;
        for (let i = 0; i < collections.length; i++) {
            const collection = collections[i];
            businessData[collection] = await firestore_1.FirestoreService.query(collection);
            await this.updateProgress(request.id, 10 + (i + 1) * progressStep);
        }
        return {
            collections: businessData,
            exportedAt: new Date(),
        };
    }
    /**
     * Export all data (full export)
     */
    async exportAllData(request) {
        const allData = {};
        // Export user data if user ID provided
        if (request.filters?.userId) {
            await this.updateProgress(request.id, 10);
            allData.userData = await this.exportUserData(request);
        }
        // Export analytics
        await this.updateProgress(request.id, 30);
        allData.analytics = await this.exportAnalyticsData({
            ...request,
            filters: {
                ...request.filters,
                startDate: request.filters?.startDate || new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
                endDate: request.filters?.endDate || new Date(),
            },
        });
        // Export audit logs
        await this.updateProgress(request.id, 50);
        allData.auditLogs = await this.exportAuditLogs(request);
        // Export security logs
        await this.updateProgress(request.id, 70);
        allData.securityLogs = await this.exportSecurityLogs(request);
        // Export business data
        await this.updateProgress(request.id, 90);
        allData.businessData = await this.exportBusinessData(request);
        return allData;
    }
    // ===========================================
    // AUDIT TRAIL MANAGEMENT
    // ===========================================
    /**
     * Log audit trail
     */
    async logAuditTrail(auditData) {
        const auditTrail = {
            id: this.generateAuditId(),
            timestamp: new Date(),
            ipAddress: this.getClientIP(),
            userAgent: this.getUserAgent(),
            sessionId: this.getSessionId(),
            ...auditData,
        };
        this.auditTrails.set(auditTrail.id, auditTrail);
        // Persist to Firestore
        await firestore_1.FirestoreService.create('auditLogs', auditTrail);
        // Also log through firebase logger
        logger_1.firebaseLogger.logAuditEvent(auditTrail.userId, auditTrail.userRole, auditTrail.action, auditTrail.resource, auditTrail.resourceId, auditTrail.changes?.before, auditTrail.changes?.after, auditTrail.success);
    }
    /**
     * Get audit trails
     */
    getAuditTrails(filters) {
        let trails = Array.from(this.auditTrails.values());
        if (filters) {
            if (filters.userId) {
                trails = trails.filter(trail => trail.userId === filters.userId);
            }
            if (filters.startDate && filters.endDate) {
                trails = trails.filter(trail => trail.timestamp >= filters.startDate && trail.timestamp <= filters.endDate);
            }
            if (filters.action) {
                trails = trails.filter(trail => trail.action === filters.action);
            }
            if (filters.resource) {
                trails = trails.filter(trail => trail.resource === filters.resource);
            }
        }
        return trails.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    }
    // ===========================================
    // COMPLIANCE REPORTING
    // ===========================================
    /**
     * Generate compliance report
     */
    async generateComplianceReport(type, startDate, endDate) {
        const report = {
            id: this.generateReportId(),
            type,
            generatedAt: new Date(),
            period: { startDate, endDate },
            summary: {
                totalDataRequests: 0,
                completedRequests: 0,
                pendingRequests: 0,
                averageResponseTime: 0,
                dataBreaches: 0,
                securityIncidents: 0,
            },
            details: {
                dataRequests: [],
                auditTrails: [],
                securityEvents: [],
                complianceViolations: [],
            },
            recommendations: [],
            status: 'draft',
        };
        // Get data requests in period
        const dataRequests = Array.from(this.exportRequests.values()).filter(req => req.requestedAt >= startDate && req.requestedAt <= endDate);
        report.details.dataRequests = dataRequests;
        report.summary.totalDataRequests = dataRequests.length;
        report.summary.completedRequests = dataRequests.filter(req => req.status === 'completed').length;
        report.summary.pendingRequests = dataRequests.filter(req => req.status === 'pending' || req.status === 'processing').length;
        // Calculate average response time
        const completedRequests = dataRequests.filter(req => req.status === 'completed' && req.completedAt);
        if (completedRequests.length > 0) {
            const totalResponseTime = completedRequests.reduce((sum, req) => {
                return sum + (req.completedAt.getTime() - req.requestedAt.getTime());
            }, 0);
            report.summary.averageResponseTime = totalResponseTime / completedRequests.length;
        }
        // Get audit trails in period
        report.details.auditTrails = this.getAuditTrails({ startDate, endDate });
        // Get security events
        const securityLogs = logger_1.firebaseLogger.getRecentSecurityLogs(1000);
        report.details.securityEvents = securityLogs.filter(log => log.timestamp >= startDate && log.timestamp <= endDate);
        report.summary.securityIncidents = report.details.securityEvents.filter(event => event.severity === 'high' || event.severity === 'critical').length;
        // Generate recommendations based on findings
        report.recommendations = this.generateComplianceRecommendations(report);
        // Store the report
        this.complianceReports.set(report.id, report);
        // Persist to Firestore
        await firestore_1.FirestoreService.create('complianceReports', report);
        logger_1.firebaseLogger.info(logger_1.LogCategory.SYSTEM, 'compliance_report_generated', `Compliance report generated: ${type}`, { reportId: report.id, period: { startDate, endDate } });
        return report;
    }
    // ===========================================
    // UTILITY METHODS
    // ===========================================
    /**
     * Start processing queue
     */
    startProcessingQueue() {
        // Process queue every 30 seconds
        setInterval(() => {
            if (!this.isProcessing && this.processingQueue.length > 0) {
                this.processNextRequest();
            }
        }, 30000);
    }
    /**
     * Start periodic cleanup
     */
    startPeriodicCleanup() {
        // Clean up expired exports every hour
        setInterval(() => {
            this.cleanupExpiredExports();
        }, 3600000);
        // Clean up old audit trails every day
        setInterval(() => {
            this.cleanupOldAuditTrails();
        }, 86400000);
    }
    /**
     * Clean up expired exports
     */
    cleanupExpiredExports() {
        const now = new Date();
        for (const [id, request] of this.exportRequests.entries()) {
            if (request.expiresAt && request.expiresAt < now) {
                this.exportRequests.delete(id);
                // Also delete from Firestore
                firestore_1.FirestoreService.delete('exportRequests', id).catch(console.error);
            }
        }
    }
    /**
     * Clean up old audit trails
     */
    cleanupOldAuditTrails() {
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        for (const [id, trail] of this.auditTrails.entries()) {
            if (trail.timestamp < thirtyDaysAgo) {
                this.auditTrails.delete(id);
            }
        }
    }
    /**
     * Load export requests from Firestore
     */
    async loadExportRequests() {
        try {
            const requests = await firestore_1.FirestoreService.query('exportRequests');
            for (const request of requests) {
                this.exportRequests.set(request.id, request);
                // Add pending requests to queue
                if (request.status === 'pending') {
                    this.processingQueue.push(request.id);
                }
            }
        }
        catch (error) {
            console.error('Failed to load export requests:', error);
        }
    }
    /**
     * Load audit trails from Firestore
     */
    async loadAuditTrails() {
        try {
            const trails = await firestore_1.FirestoreService.query('auditLogs');
            for (const trail of trails) {
                this.auditTrails.set(trail.id, trail);
            }
        }
        catch (error) {
            console.error('Failed to load audit trails:', error);
        }
    }
    /**
     * Update export progress
     */
    async updateProgress(exportId, progress) {
        const request = this.exportRequests.get(exportId);
        if (request) {
            request.progress = progress;
            await this.persistExportRequest(request);
        }
    }
    /**
     * Calculate estimated completion time
     */
    calculateEstimatedCompletion(type) {
        const baseTime = Date.now();
        switch (type) {
            case 'user_data':
                return new Date(baseTime + 5 * 60 * 1000); // 5 minutes
            case 'analytics':
                return new Date(baseTime + 10 * 60 * 1000); // 10 minutes
            case 'audit_logs':
                return new Date(baseTime + 15 * 60 * 1000); // 15 minutes
            case 'security_logs':
                return new Date(baseTime + 15 * 60 * 1000); // 15 minutes
            case 'business_data':
                return new Date(baseTime + 30 * 60 * 1000); // 30 minutes
            case 'full_export':
                return new Date(baseTime + 60 * 60 * 1000); // 1 hour
            default:
                return new Date(baseTime + 10 * 60 * 1000); // 10 minutes
        }
    }
    /**
     * Generate download URL
     */
    async generateDownloadUrl(data, format) {
        // This would integrate with Firebase Storage or other file storage
        // For now, return a placeholder URL
        return `https://storage.example.com/exports/${data.exportId}.${format}`;
    }
    /**
     * Calculate data size
     */
    calculateDataSize(data) {
        return JSON.stringify(data).length;
    }
    /**
     * Calculate record count
     */
    calculateRecordCount(data) {
        let count = 0;
        const countRecords = (obj) => {
            if (Array.isArray(obj)) {
                count += obj.length;
                obj.forEach(countRecords);
            }
            else if (typeof obj === 'object' && obj !== null) {
                Object.values(obj).forEach(countRecords);
            }
        };
        countRecords(data);
        return count;
    }
    /**
     * Generate compliance recommendations
     */
    generateComplianceRecommendations(report) {
        const recommendations = [];
        if (report.summary.averageResponseTime > 30 * 24 * 60 * 60 * 1000) { // 30 days
            recommendations.push('Consider improving data export processing time to meet GDPR requirements');
        }
        if (report.summary.securityIncidents > 0) {
            recommendations.push('Review and address security incidents to improve compliance posture');
        }
        if (report.summary.pendingRequests > 10) {
            recommendations.push('Consider increasing processing capacity for data export requests');
        }
        return recommendations;
    }
    // Helper methods for getting client information
    getClientIP() {
        // This would be implemented based on your environment
        return 'unknown';
    }
    getUserAgent() {
        return typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown';
    }
    getSessionId() {
        // This would get the current session ID
        return 'session_unknown';
    }
    async persistExportRequest(request) {
        await firestore_1.FirestoreService.update('exportRequests', request.id, request);
    }
    generateExportId() {
        return `export_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    generateAuditId() {
        return `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    generateReportId() {
        return `compliance_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    // ===========================================
    // PUBLIC API METHODS
    // ===========================================
    /**
     * Get export requests
     */
    getExportRequests(userId) {
        let requests = Array.from(this.exportRequests.values());
        if (userId) {
            requests = requests.filter(req => req.requestedBy === userId);
        }
        return requests.sort((a, b) => b.requestedAt.getTime() - a.requestedAt.getTime());
    }
    /**
     * Get compliance reports
     */
    getComplianceReports() {
        return Array.from(this.complianceReports.values())
            .sort((a, b) => b.generatedAt.getTime() - a.generatedAt.getTime());
    }
    /**
     * Get service status
     */
    getServiceStatus() {
        const requests = Array.from(this.exportRequests.values());
        return {
            totalExportRequests: requests.length,
            pendingRequests: requests.filter(req => req.status === 'pending').length,
            processingRequests: requests.filter(req => req.status === 'processing').length,
            completedRequests: requests.filter(req => req.status === 'completed').length,
            totalAuditTrails: this.auditTrails.size,
            totalComplianceReports: this.complianceReports.size,
            isProcessing: this.isProcessing,
            queueLength: this.processingQueue.length,
        };
    }
}
exports.DataExportService = DataExportService;
// Export singleton instance
exports.dataExportService = DataExportService.getInstance();
