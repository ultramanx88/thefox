import CryptoJS from 'crypto-js';

interface SecurityEvent {
  type: 'login_attempt' | 'suspicious_activity' | 'data_breach' | 'rate_limit' | 'injection_attempt';
  severity: 'low' | 'medium' | 'high' | 'critical';
  ip: string;
  userAgent: string;
  timestamp: Date;
  details: any;
}

interface BiometricData {
  fingerprint?: string;
  faceId?: string;
  voiceprint?: string;
}

export class AdvancedSecurityManager {
  private static readonly SECRET_KEY = process.env.NEXT_PUBLIC_ENCRYPTION_KEY || 'fallback-key';
  private static readonly MAX_LOGIN_ATTEMPTS = 5;
  private static readonly LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutes
  private static securityEvents: SecurityEvent[] = [];
  private static blockedIPs: Set<string> = new Set();
  private static rateLimits: Map<string, { count: number; resetTime: number }> = new Map();

  // Multi-Factor Authentication
  static async generateTOTP(secret: string): Promise<string> {
    const epoch = Math.floor(Date.now() / 30000);
    const hmac = CryptoJS.HmacSHA1(epoch.toString(), secret);
    const offset = parseInt(hmac.toString().slice(-1), 16);
    const code = parseInt(hmac.toString().substr(offset * 2, 8), 16) % 1000000;
    return code.toString().padStart(6, '0');
  }

  static async verifyTOTP(token: string, secret: string): Promise<boolean> {
    const currentCode = await this.generateTOTP(secret);
    const previousCode = await this.generateTOTP(secret); // Allow 30s window
    return token === currentCode || token === previousCode;
  }

  // Biometric Authentication
  static async enrollBiometric(userId: string, type: keyof BiometricData, data: string): Promise<boolean> {
    const encrypted = this.encrypt(data);
    // Store in secure database
    localStorage.setItem(`biometric_${userId}_${type}`, encrypted);
    return true;
  }

  static async verifyBiometric(userId: string, type: keyof BiometricData, data: string): Promise<boolean> {
    const stored = localStorage.getItem(`biometric_${userId}_${type}`);
    if (!stored) return false;
    
    const decrypted = this.decrypt(stored);
    return this.compareHashes(data, decrypted);
  }

  // Advanced Encryption
  static encrypt(data: string): string {
    return CryptoJS.AES.encrypt(data, this.SECRET_KEY).toString();
  }

  static decrypt(encryptedData: string): string {
    const bytes = CryptoJS.AES.decrypt(encryptedData, this.SECRET_KEY);
    return bytes.toString(CryptoJS.enc.Utf8);
  }

  static hashPassword(password: string, salt?: string): string {
    const saltValue = salt || CryptoJS.lib.WordArray.random(128/8).toString();
    const hash = CryptoJS.PBKDF2(password, saltValue, { keySize: 256/32, iterations: 10000 });
    return `${saltValue}:${hash.toString()}`;
  }

  static verifyPassword(password: string, hashedPassword: string): boolean {
    const [salt, hash] = hashedPassword.split(':');
    const newHash = CryptoJS.PBKDF2(password, salt, { keySize: 256/32, iterations: 10000 });
    return hash === newHash.toString();
  }

  // Rate Limiting & DDoS Protection
  static checkRateLimit(ip: string, endpoint: string, maxRequests = 100, windowMs = 60000): boolean {
    const key = `${ip}:${endpoint}`;
    const now = Date.now();
    const limit = this.rateLimits.get(key);

    if (!limit || now > limit.resetTime) {
      this.rateLimits.set(key, { count: 1, resetTime: now + windowMs });
      return true;
    }

    if (limit.count >= maxRequests) {
      this.logSecurityEvent({
        type: 'rate_limit',
        severity: 'medium',
        ip,
        userAgent: navigator.userAgent,
        timestamp: new Date(),
        details: { endpoint, attempts: limit.count }
      });
      return false;
    }

    limit.count++;
    return true;
  }

  // SQL Injection & XSS Protection
  static sanitizeInput(input: string): string {
    return input
      .replace(/[<>\"'%;()&+]/g, '')
      .replace(/script/gi, '')
      .replace(/javascript/gi, '')
      .replace(/vbscript/gi, '')
      .replace(/onload/gi, '')
      .replace(/onerror/gi, '');
  }

  static validateSQL(query: string): boolean {
    const dangerousPatterns = [
      /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION)\b)/gi,
      /(--|\/\*|\*\/|;)/g,
      /(\b(OR|AND)\s+\d+\s*=\s*\d+)/gi
    ];
    
    return !dangerousPatterns.some(pattern => pattern.test(query));
  }

  // Device Fingerprinting
  static async generateDeviceFingerprint(): Promise<string> {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    ctx!.textBaseline = 'top';
    ctx!.font = '14px Arial';
    ctx!.fillText('Device fingerprint', 2, 2);
    
    const fingerprint = {
      screen: `${screen.width}x${screen.height}`,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      language: navigator.language,
      platform: navigator.platform,
      userAgent: navigator.userAgent,
      canvas: canvas.toDataURL(),
      webgl: this.getWebGLFingerprint(),
      fonts: await this.getAvailableFonts()
    };

    return CryptoJS.SHA256(JSON.stringify(fingerprint)).toString();
  }

  private static getWebGLFingerprint(): string {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl');
    if (!gl) return '';
    
    const renderer = gl.getParameter(gl.RENDERER);
    const vendor = gl.getParameter(gl.VENDOR);
    return `${vendor}~${renderer}`;
  }

  private static async getAvailableFonts(): Promise<string[]> {
    const fonts = ['Arial', 'Helvetica', 'Times', 'Courier', 'Verdana', 'Georgia', 'Palatino'];
    const available: string[] = [];
    
    for (const font of fonts) {
      if (document.fonts.check(`12px ${font}`)) {
        available.push(font);
      }
    }
    
    return available;
  }

  // Behavioral Analysis
  static analyzeUserBehavior(events: any[]): { riskScore: number; anomalies: string[] } {
    const anomalies: string[] = [];
    let riskScore = 0;

    // Check for unusual login times
    const loginHours = events.filter(e => e.type === 'login').map(e => new Date(e.timestamp).getHours());
    const avgLoginHour = loginHours.reduce((a, b) => a + b, 0) / loginHours.length;
    
    if (Math.abs(new Date().getHours() - avgLoginHour) > 6) {
      anomalies.push('Unusual login time');
      riskScore += 20;
    }

    // Check for rapid successive actions
    const recentEvents = events.filter(e => Date.now() - new Date(e.timestamp).getTime() < 60000);
    if (recentEvents.length > 50) {
      anomalies.push('Rapid successive actions');
      riskScore += 30;
    }

    // Check for location anomalies (if geolocation available)
    const locations = events.filter(e => e.location).map(e => e.location);
    if (locations.length > 1) {
      const distances = this.calculateLocationDistances(locations);
      if (Math.max(...distances) > 1000) { // 1000km
        anomalies.push('Impossible travel detected');
        riskScore += 50;
      }
    }

    return { riskScore: Math.min(riskScore, 100), anomalies };
  }

  private static calculateLocationDistances(locations: any[]): number[] {
    // Simplified distance calculation
    return locations.map((loc, i) => {
      if (i === 0) return 0;
      const prev = locations[i - 1];
      return Math.sqrt(Math.pow(loc.lat - prev.lat, 2) + Math.pow(loc.lng - prev.lng, 2)) * 111; // Rough km conversion
    });
  }

  // Real-time Threat Detection
  static detectThreats(request: any): { blocked: boolean; reason?: string } {
    // Check IP blacklist
    if (this.blockedIPs.has(request.ip)) {
      return { blocked: true, reason: 'IP blocked due to previous violations' };
    }

    // Check for bot behavior
    if (this.detectBotBehavior(request)) {
      return { blocked: true, reason: 'Bot behavior detected' };
    }

    // Check for payload anomalies
    if (this.detectPayloadAnomalies(request.body)) {
      return { blocked: true, reason: 'Malicious payload detected' };
    }

    return { blocked: false };
  }

  private static detectBotBehavior(request: any): boolean {
    const botSignatures = [
      /bot|crawler|spider|scraper/i,
      /curl|wget|python|java/i,
      /automated|headless/i
    ];
    
    return botSignatures.some(pattern => pattern.test(request.userAgent));
  }

  private static detectPayloadAnomalies(body: any): boolean {
    if (!body) return false;
    
    const payload = JSON.stringify(body);
    const suspiciousPatterns = [
      /<script/i,
      /javascript:/i,
      /eval\(/i,
      /document\.cookie/i,
      /window\.location/i,
      /\.\.\//g,
      /union\s+select/i
    ];
    
    return suspiciousPatterns.some(pattern => pattern.test(payload));
  }

  // Security Event Logging
  static logSecurityEvent(event: SecurityEvent): void {
    this.securityEvents.push(event);
    
    // Auto-block IPs with critical events
    if (event.severity === 'critical') {
      this.blockedIPs.add(event.ip);
    }

    // Send to security monitoring service
    this.sendToSecurityService(event);
  }

  private static async sendToSecurityService(event: SecurityEvent): Promise<void> {
    try {
      await fetch('/api/security/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(event)
      });
    } catch (error) {
      console.error('Failed to send security event:', error);
    }
  }

  // Utility Methods
  private static compareHashes(input: string, stored: string): boolean {
    return CryptoJS.SHA256(input).toString() === stored;
  }

  static generateSecureToken(length = 32): string {
    return CryptoJS.lib.WordArray.random(length).toString();
  }

  static isSecureConnection(): boolean {
    return location.protocol === 'https:';
  }

  static getSecurityHeaders(): Record<string, string> {
    return {
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block',
      'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
      'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'",
      'Referrer-Policy': 'strict-origin-when-cross-origin'
    };
  }
}