#!/bin/bash

# Security script for theFOX application
set -e

echo "🔒 Running security check for theFOX application..."

# Configuration
SERVICE_NAME="thefox"
REGION="asia-southeast1"
SERVICE_URL=""

# Get service URL
if [ -z "$SERVICE_URL" ]; then
    SERVICE_URL=$(gcloud run services describe $SERVICE_NAME --region=$REGION --format="value(status.url)")
fi

echo "🔍 Checking security for service: $SERVICE_URL"

# Check HTTPS
echo "🔐 Checking HTTPS..."
if curl -s -I "$SERVICE_URL" | grep -q "HTTP/2 200"; then
    echo "✅ HTTPS is enabled"
else
    echo "❌ HTTPS is not properly configured"
fi

# Check security headers
echo "🛡️ Checking security headers..."
HEADERS=$(curl -s -I "$SERVICE_URL")

if echo "$HEADERS" | grep -q "Strict-Transport-Security"; then
    echo "✅ HSTS header present"
else
    echo "❌ HSTS header missing"
fi

if echo "$HEADERS" | grep -q "X-Frame-Options"; then
    echo "✅ X-Frame-Options header present"
else
    echo "❌ X-Frame-Options header missing"
fi

if echo "$HEADERS" | grep -q "X-Content-Type-Options"; then
    echo "✅ X-Content-Type-Options header present"
else
    echo "❌ X-Content-Type-Options header missing"
fi

if echo "$HEADERS" | grep -q "X-XSS-Protection"; then
    echo "✅ X-XSS-Protection header present"
else
    echo "❌ X-XSS-Protection header missing"
fi

# Check for common vulnerabilities
echo "🔍 Checking for common vulnerabilities..."

# Check for directory traversal
if curl -s "$SERVICE_URL/../" | grep -q "403 Forbidden\|404 Not Found"; then
    echo "✅ Directory traversal protection active"
else
    echo "⚠️ Directory traversal protection may be weak"
fi

# Check for SQL injection (basic test)
if curl -s "$SERVICE_URL/api/?id=1' OR '1'='1" | grep -q "error\|exception"; then
    echo "⚠️ Potential SQL injection vulnerability detected"
else
    echo "✅ SQL injection protection appears active"
fi

# Check for XSS (basic test)
if curl -s "$SERVICE_URL/?q=<script>alert('xss')</script>" | grep -q "<script>"; then
    echo "⚠️ Potential XSS vulnerability detected"
else
    echo "✅ XSS protection appears active"
fi

# Check rate limiting
echo "🚦 Checking rate limiting..."
RATE_LIMIT_RESPONSE=$(curl -s -w "%{http_code}" -o /dev/null "$SERVICE_URL/api/")
if [ "$RATE_LIMIT_RESPONSE" = "429" ]; then
    echo "✅ Rate limiting is active"
else
    echo "⚠️ Rate limiting may not be properly configured"
fi

# Check authentication endpoints
echo "🔐 Checking authentication endpoints..."
if curl -s "$SERVICE_URL/api/auth/login" | grep -q "method.*POST\|csrf\|token"; then
    echo "✅ Authentication endpoint appears secure"
else
    echo "⚠️ Authentication endpoint may need review"
fi

# Check for exposed sensitive files
echo "📁 Checking for exposed sensitive files..."
SENSITIVE_FILES=(".env" "config.json" "database.sql" "backup.sql" "logs.txt")
for file in "${SENSITIVE_FILES[@]}"; do
    if curl -s "$SERVICE_URL/$file" | grep -q "404\|403"; then
        echo "✅ $file is not exposed"
    else
        echo "❌ $file may be exposed"
    fi
done

# Check SSL/TLS configuration
echo "🔒 Checking SSL/TLS configuration..."
if command -v openssl &> /dev/null; then
    SSL_INFO=$(echo | openssl s_client -servername $(echo $SERVICE_URL | sed 's|https://||' | sed 's|/.*||') -connect $(echo $SERVICE_URL | sed 's|https://||' | sed 's|/.*||'):443 2>/dev/null | openssl x509 -noout -text 2>/dev/null)
    
    if echo "$SSL_INFO" | grep -q "TLSv1.2\|TLSv1.3"; then
        echo "✅ Modern TLS versions supported"
    else
        echo "⚠️ Consider upgrading to modern TLS versions"
    fi
    
    if echo "$SSL_INFO" | grep -q "RSA 2048\|RSA 4096\|ECDSA"; then
        echo "✅ Strong encryption algorithms supported"
    else
        echo "⚠️ Consider upgrading encryption algorithms"
    fi
else
    echo "⚠️ OpenSSL not available for SSL/TLS check"
fi

# Check for exposed ports
echo "🔌 Checking for exposed ports..."
if gcloud run services describe $SERVICE_NAME --region=$REGION --format="value(spec.template.spec.containers[0].ports[0].containerPort)" | grep -q "80\|443"; then
    echo "✅ Only necessary ports are exposed"
else
    echo "⚠️ Review exposed ports configuration"
fi

# Check environment variables
echo "🔧 Checking environment variables..."
ENV_VARS=$(gcloud run services describe $SERVICE_NAME --region=$REGION --format="value(spec.template.spec.containers[0].env[].name)")
if echo "$ENV_VARS" | grep -q "PASSWORD\|SECRET\|KEY\|TOKEN"; then
    echo "⚠️ Sensitive environment variables detected - ensure they are properly secured"
else
    echo "✅ No obvious sensitive environment variables exposed"
fi

echo "✅ Security check completed!"
echo ""
echo "📋 Security recommendations:"
echo "1. Ensure all security headers are properly configured"
echo "2. Implement proper authentication and authorization"
echo "3. Use HTTPS everywhere"
echo "4. Regularly update dependencies"
echo "5. Monitor for suspicious activity"
echo "6. Implement proper logging and monitoring"
