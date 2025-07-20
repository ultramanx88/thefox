# 🚀 Git-Based Deployment Guide

คู่มือการ deploy แบบ Git-driven สำหรับโปรเจกต์ TheFox

## 📋 Overview

โปรเจกต์นี้ใช้ **Git เป็นตัวหลัก** ในการควบคุม deployment ไปยัง Firebase โดยมี workflow ดังนี้:

- **Git Commits** → Auto deploy to staging
- **Git Tags** → Deploy to production/staging
- **Git Branches** → Deploy to specific environments
- **Pull Requests** → Preview deployments

## 🔧 Setup

### 1. Install Git Hooks
```bash
./scripts/setup-git-hooks.sh
```

### 2. Prerequisites
- Node.js (version 22+)
- Git configured with proper commit message format

## 🚀 Git-Based Deployment Workflows

### 1. Auto Staging Deployment
```bash
# Push to main branch → Auto deploy to staging
git add .
git commit -m "feat: add new feature"
git push origin main
```
- ✅ Automatic staging deployment
- ✅ Quality checks (lint, typecheck)
- ✅ Build verification

### 2. Production Deployment via Tags
```bash
# Create version tag → Deploy to production
git tag v1.0.0
git push origin v1.0.0

# Or create release tag
git tag release-prod-$(date +%Y%m%d)
git push origin --tags
```

### 3. Staging Deployment via Tags
```bash
# Create staging tag → Deploy to staging
git tag v1.0.0-beta
git push origin v1.0.0-beta

# Or create staging release tag
git tag release-staging-$(date +%Y%m%d)
git push origin --tags
```

### 4. Branch-Based Deployment
```bash
# Deploy to production via branch
git checkout -b deploy/production
git push origin deploy/production

# Deploy to staging via branch
git checkout -b deploy/staging
git push origin deploy/staging

# Hotfix deployment
git checkout -b hotfix/critical-bug-fix
git push origin hotfix/critical-bug-fix
```

## 🏷️ Git Tag Patterns

### Production Tags
- `v1.0.0` - Semantic version tags
- `v2.1.3` - Major.Minor.Patch format
- `release-prod-*` - Production release tags

### Staging Tags
- `v1.0.0-beta` - Pre-release versions
- `v1.0.0-alpha` - Alpha versions
- `release-staging-*` - Staging release tags

## 🌿 Git Branch Patterns

### Deployment Branches
- `deploy/production` - Production deployment
- `deploy/staging` - Staging deployment
- `hotfix/*` - Emergency production fixes

### Development Branches
- `main` - Auto-deploy to staging
- `feature/*` - Feature development
- `bugfix/*` - Bug fixes

## 📝 Commit Message Format

Git hooks จะตรวจสอบ commit message format:

```
<type>(<scope>): <description>

Types:
- feat: New feature
- fix: Bug fix
- docs: Documentation
- style: Code style changes
- refactor: Code refactoring
- test: Tests
- chore: Maintenance
- deploy: Deployment related
```

### Examples:
```bash
git commit -m "feat(auth): add user login functionality"
git commit -m "fix: resolve Firebase connection issue"
git commit -m "deploy: release version 1.2.0"
```

## 🔄 Deployment Flow Examples

### Feature Development to Production
```bash
# 1. Develop feature
git checkout -b feature/user-profile
git commit -m "feat(profile): add user profile page"
git push origin feature/user-profile

# 2. Create PR → Preview deployment
# 3. Merge to main → Staging deployment
git checkout main
git merge feature/user-profile
git push origin main

# 4. Test in staging, then deploy to production
git tag v1.1.0
git push origin v1.1.0
```

### Hotfix Deployment
```bash
# 1. Create hotfix branch
git checkout -b hotfix/payment-bug
git commit -m "fix(payment): resolve payment processing error"

# 2. Push hotfix → Auto production deployment
git push origin hotfix/payment-bug

# 3. Merge back to main
git checkout main
git merge hotfix/payment-bug
git push origin main
```

## 🎯 Deployment Triggers

| Action | Environment | Components | Auto Deploy |
|--------|-------------|------------|-------------|
| Push to `main` | Staging | Hosting only | ✅ |
| Create `v*.*.*` tag | Production | Hosting + Functions | ✅ |
| Create `v*.*.*-*` tag | Staging | Hosting only | ✅ |
| Push to `deploy/production` | Production | Hosting + Functions | ✅ |
| Push to `deploy/staging` | Staging | Hosting only | ✅ |
| Push to `hotfix/*` | Production | Hosting + Functions | ✅ |
| Create Pull Request | Preview | Hosting only | ✅ |

## 🔍 Monitoring & Debugging

### Check Deployment Status
```bash
# View recent deployments
git log --oneline --grep="deploy"

# Check tags
git tag -l

# View deployment workflows
# GitHub → Actions tab
```

### Local Testing
```bash
# Run full CI pipeline locally
npm run ci

# Test build process
npm run build:all
```

## 📊 Best Practices

### Git Workflow
1. **Always use descriptive commit messages**
2. **Test locally before pushing**
3. **Use staging for testing before production**
4. **Create tags for production releases**
5. **Use hotfix branches for emergency fixes**

### Deployment Safety
1. **Staging first, production second**
2. **Monitor deployment status**
3. **Keep deployment history via Git tags**
4. **Use semantic versioning**
5. **Document deployment decisions**

## 🚨 Emergency Procedures

### Rollback Production
```bash
# Find previous working tag
git tag -l | grep "v" | sort -V

# Deploy previous version
git tag v1.0.1-rollback
git push origin v1.0.1-rollback
```

### Quick Hotfix
```bash
# Create and deploy hotfix immediately
git checkout -b hotfix/emergency-fix
git commit -m "fix: emergency production fix"
git push origin hotfix/emergency-fix
# → Auto deploys to production
```

## 🔧 Troubleshooting

### Common Issues
1. **Deployment failed**: Check GitHub Actions logs
2. **Tag not deploying**: Verify tag format matches patterns
3. **Branch not deploying**: Check branch name matches patterns
4. **Build errors**: Run `npm run ci` locally first

### Debug Commands
```bash
# Check current branch and status
git status
git branch -a

# View recent commits
git log --oneline -10

# Check remote tags
git ls-remote --tags origin
```

Git-based deployment ทำให้การ deploy มีความโปร่งใส ติดตามได้ และควบคุมได้ง่ายผ่าน Git workflow ที่คุ้นเคย!