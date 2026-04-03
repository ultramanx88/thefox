# TheFox Microservices Architecture

## Services Overview

```
├── api-gateway/          # Kong/Nginx Gateway
├── user-service/         # Authentication & User Management
├── product-service/      # Product Catalog & Inventory
├── order-service/        # Cart & Order Management
├── payment-service/      # Payment Processing
├── notification-service/ # Push/Email/SMS Notifications
├── analytics-service/    # Tracking & Reporting
└── shared/              # Common libraries
```

## Communication
- **Synchronous**: REST API via API Gateway
- **Asynchronous**: Message Queue (Redis/RabbitMQ)
- **Database**: Per-service databases

## Deployment
- Docker containers
- Kubernetes orchestration
- Service mesh (Istio)