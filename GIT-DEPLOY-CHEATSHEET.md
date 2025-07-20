# 🚀 Git Deployment Cheat Sheet

Quick reference สำหรับ Git-based deployment

## 🏷️ Tag-Based Deployment

### Production Deployment

```bash
# Semantic version (recommended)
git tag v1.0.0 && git push origin v1.0.0

# Release tag
git tag release-prod-$(date +%Y%m%d-%H%M) && git push origin --tags
```

### Staging Deployment

```bash
# Pre-release version
git tag v1.0.0-beta && git push origin v1.0.0-beta

# Staging release tag
git tag release-staging-$(date +%Y%m%d-%H%M) && git push origin --tags
```

## 🌿 Branch-Based Deployment

### Production

```bash
git checkout -b deploy/production
git push origin deploy/production
```

### Staging

```bash
git checkout -b deploy/staging
git push origin deploy/staging
```

### Hotfix (Emergency Production)

```bash
git checkout -b hotfix/critical-fix
# Make your changes
git commit -m "fix: critical production issue"
git push origin hotfix/critical-fix
```

## 🔄 Common Workflows

### Feature → Staging → Production

```bash
# 1. Push to main (auto staging)
git push origin main

# 2. Test staging, then tag for production
git tag v1.1.0 && git push origin v1.1.0
```

### Quick Production Fix

```bash
# Hotfix branch auto-deploys to production
git checkout -b hotfix/urgent-fix
git commit -m "fix: urgent production issue"
git push origin hotfix/urgent-fix
```

### Rollback Production

```bash
# Tag previous working version
git tag v1.0.1-rollback && git push origin v1.0.1-rollback
```

## 📋 Pre-Deployment Checklist

```bash
# 1. Run local checks
npm run ci

# 2. Check Git status
git status

# 3. Verify commit message format
git log -1 --pretty=%B

# 4. Push and deploy
git push origin <branch/tag>
```

## 🎯 Deployment Matrix

| Command                             | Environment | Components          | Auto Deploy |
| ----------------------------------- | ----------- | ------------------- | ----------- |
| `git push origin main`              | Staging     | Hosting             | ✅          |
| `git tag v1.0.0`                    | Production  | Hosting + Functions | ✅          |
| `git tag v1.0.0-beta`               | Staging     | Hosting             | ✅          |
| `git push origin deploy/production` | Production  | Hosting + Functions | ✅          |
| `git push origin hotfix/fix`        | Production  | Hosting + Functions | ✅          |

## 🚨 Emergency Commands

### Stop Deployment

```bash
# Cancel GitHub Actions workflow (manual)
# Go to GitHub → Actions → Cancel running workflow
```

### Quick Rollback

```bash
# Find last working version
git tag -l | grep "v" | sort -V | tail -5

# Deploy previous version
git tag v<previous-version>-rollback
git push origin v<previous-version>-rollback
```

### Debug Deployment

```bash
# Check deployment status
git log --oneline --grep="deploy" -5

# View all tags
git tag -l | sort -V

# Check remote branches
git branch -r | grep deploy
```

## 💡 Pro Tips

1. **Always test locally first**: `npm run ci`
2. **Use semantic versioning**: `v1.2.3`
3. **Staging before production**: Test in staging first
4. **Descriptive commit messages**: Follow the format
5. **Monitor deployments**: Check GitHub Actions
6. **Keep deployment history**: Use meaningful tags

## 🔗 Quick Links

- **GitHub Actions**: [Repository Actions Tab]
- **Firebase Console**: https://console.firebase.google.com
- **Staging URL**: Check Firebase Console
- **Production URL**: https://thefox-sp7zz.web.app
