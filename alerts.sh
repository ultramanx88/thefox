#!/bin/bash

# Alerts script for theFOX application
set -e

echo "🚨 Managing alerts for theFOX application..."

# Configuration
SERVICE_NAME="thefox"
REGION="asia-southeast1"
NOTIFICATION_CHANNEL=""

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --create)
            CREATE=true
            shift
            ;;
        --delete)
            DELETE=true
            shift
            ;;
        --list)
            LIST=true
            shift
            ;;
        --channel)
            NOTIFICATION_CHANNEL="$2"
            shift 2
            ;;
        --help)
            echo "Usage: $0 [OPTIONS]"
            echo "Options:"
            echo "  --create              Create monitoring alerts"
            echo "  --delete              Delete monitoring alerts"
            echo "  --list                List existing alerts"
            echo "  --channel CHANNEL     Notification channel for alerts"
            echo "  --help                Show this help message"
            exit 0
            ;;
        *)
            echo "Unknown option: $1"
            exit 1
            ;;
    esac
done

# List existing alerts
if [ "$LIST" = true ]; then
    echo "📋 Existing alerts:"
    gcloud alpha monitoring policies list --filter="displayName:theFOX"
    exit 0
fi

# Create alerts
if [ "$CREATE" = true ]; then
    echo "🔧 Creating monitoring alerts..."
    
    # Get notification channel
    if [ -z "$NOTIFICATION_CHANNEL" ]; then
        echo "📧 Please enter notification channel (email):"
        read -p "Email: " NOTIFICATION_CHANNEL
    fi
    
    # Create notification channel
    CHANNEL_ID=$(gcloud alpha monitoring channels create \
        --display-name="theFOX Alerts" \
        --type=email \
        --channel-labels=email_address="$NOTIFICATION_CHANNEL" \
        --format="value(name)" | sed 's|.*/||')
    
    echo "📧 Notification channel created: $CHANNEL_ID"
    
    # Create alert policies
    echo "🚨 Creating alert policies..."
    
    # High error rate alert
    gcloud alpha monitoring policies create \
        --policy-from-file=<(cat << EOF
{
  "displayName": "theFOX High Error Rate",
  "conditions": [
    {
      "displayName": "Error rate > 5%",
      "conditionThreshold": {
        "filter": "resource.type=\"cloud_run_revision\" AND resource.labels.service_name=\"$SERVICE_NAME\"",
        "comparison": "COMPARISON_GREATER_THAN",
        "thresholdValue": 0.05,
        "duration": "300s",
        "aggregations": [
          {
            "alignmentPeriod": "60s",
            "perSeriesAligner": "ALIGN_RATE",
            "crossSeriesReducer": "REDUCE_SUM",
            "groupByFields": ["resource.labels.service_name"]
          }
        ]
      }
    }
  ],
  "notificationChannels": ["projects/$(gcloud config get-value project)/notificationChannels/$CHANNEL_ID"],
  "alertStrategy": {
    "autoClose": "1800s"
  }
}
EOF
)
    
    # High response time alert
    gcloud alpha monitoring policies create \
        --policy-from-file=<(cat << EOF
{
  "displayName": "theFOX High Response Time",
  "conditions": [
    {
      "displayName": "Response time > 2s",
      "conditionThreshold": {
        "filter": "resource.type=\"cloud_run_revision\" AND resource.labels.service_name=\"$SERVICE_NAME\"",
        "comparison": "COMPARISON_GREATER_THAN",
        "thresholdValue": 2.0,
        "duration": "300s",
        "aggregations": [
          {
            "alignmentPeriod": "60s",
            "perSeriesAligner": "ALIGN_DELTA",
            "crossSeriesReducer": "REDUCE_PERCENTILE_95",
            "groupByFields": ["resource.labels.service_name"]
          }
        ]
      }
    }
  ],
  "notificationChannels": ["projects/$(gcloud config get-value project)/notificationChannels/$CHANNEL_ID"],
  "alertStrategy": {
    "autoClose": "1800s"
  }
}
EOF
)
    
    # Service down alert
    gcloud alpha monitoring policies create \
        --policy-from-file=<(cat << EOF
{
  "displayName": "theFOX Service Down",
  "conditions": [
    {
      "displayName": "Service is down",
      "conditionThreshold": {
        "filter": "resource.type=\"cloud_run_revision\" AND resource.labels.service_name=\"$SERVICE_NAME\"",
        "comparison": "COMPARISON_LESS_THAN",
        "thresholdValue": 1,
        "duration": "60s",
        "aggregations": [
          {
            "alignmentPeriod": "60s",
            "perSeriesAligner": "ALIGN_RATE",
            "crossSeriesReducer": "REDUCE_SUM",
            "groupByFields": ["resource.labels.service_name"]
          }
        ]
      }
    }
  ],
  "notificationChannels": ["projects/$(gcloud config get-value project)/notificationChannels/$CHANNEL_ID"],
  "alertStrategy": {
    "autoClose": "300s"
  }
}
EOF
)
    
    # High memory usage alert
    gcloud alpha monitoring policies create \
        --policy-from-file=<(cat << EOF
{
  "displayName": "theFOX High Memory Usage",
  "conditions": [
    {
      "displayName": "Memory usage > 80%",
      "conditionThreshold": {
        "filter": "resource.type=\"cloud_run_revision\" AND resource.labels.service_name=\"$SERVICE_NAME\"",
        "comparison": "COMPARISON_GREATER_THAN",
        "thresholdValue": 0.8,
        "duration": "300s",
        "aggregations": [
          {
            "alignmentPeriod": "60s",
            "perSeriesAligner": "ALIGN_MEAN",
            "crossSeriesReducer": "REDUCE_MEAN",
            "groupByFields": ["resource.labels.service_name"]
          }
        ]
      }
    }
  ],
  "notificationChannels": ["projects/$(gcloud config get-value project)/notificationChannels/$CHANNEL_ID"],
  "alertStrategy": {
    "autoClose": "1800s"
  }
}
EOF
)
    
    echo "✅ Monitoring alerts created successfully!"
    echo "📧 Notifications will be sent to: $NOTIFICATION_CHANNEL"
fi

# Delete alerts
if [ "$DELETE" = true ]; then
    echo "🗑️ Deleting monitoring alerts..."
    
    # Get policy IDs
    POLICY_IDS=$(gcloud alpha monitoring policies list \
        --filter="displayName:theFOX" \
        --format="value(name)" | sed 's|.*/||')
    
    # Delete policies
    for policy_id in $POLICY_IDS; do
        echo "Deleting policy: $policy_id"
        gcloud alpha monitoring policies delete $policy_id --quiet
    done
    
    echo "✅ Monitoring alerts deleted successfully!"
fi

echo "✅ Alerts management completed!"