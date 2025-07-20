#!/bin/bash

# Setup Git hooks for TheFox project
set -e

HOOKS_DIR=".git/hooks"
SCRIPTS_DIR="scripts/git-hooks"

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}Setting up Git hooks...${NC}"

# Create git-hooks directory if it doesn't exist
mkdir -p "$SCRIPTS_DIR"

# Create pre-commit hook
cat > "$SCRIPTS_DIR/pre-commit" << 'EOF'
#!/bin/bash

# Pre-commit hook for TheFox project
set -e

echo "🔍 Running pre-commit checks..."

# Check if there are staged files
if git diff --cached --quiet; then
    echo "No staged changes found."
    exit 0
fi

# Run linter
echo "📝 Running linter..."
npm run lint:all

# Run type check
echo "🔍 Running type check..."
npm run typecheck

# Check for TODO/FIXME comments in staged files
echo "📋 Checking for TODO/FIXME comments..."
staged_files=$(git diff --cached --name-only --diff-filter=ACM | grep -E '\.(ts|tsx|js|jsx)$' || true)

if [ -n "$staged_files" ]; then
    todo_count=$(echo "$staged_files" | xargs grep -n "TODO\|FIXME" || true)
    if [ -n "$todo_count" ]; then
        echo "⚠️  Found TODO/FIXME comments:"
        echo "$todo_count"
        echo ""
        echo "Consider addressing these before committing."
    fi
fi

echo "✅ Pre-commit checks passed!"
EOF

# Create commit-msg hook
cat > "$SCRIPTS_DIR/commit-msg" << 'EOF'
#!/bin/bash

# Commit message hook for TheFox project
commit_regex='^(feat|fix|docs|style|refactor|test|chore|deploy)(\(.+\))?: .{1,50}'

if ! grep -qE "$commit_regex" "$1"; then
    echo "❌ Invalid commit message format!"
    echo ""
    echo "Commit message should follow the format:"
    echo "  <type>(<scope>): <description>"
    echo ""
    echo "Types: feat, fix, docs, style, refactor, test, chore, deploy"
    echo "Example: feat(auth): add user login functionality"
    echo "Example: fix: resolve deployment issue"
    echo "Example: deploy: release v1.2.0"
    echo ""
    exit 1
fi

echo "✅ Commit message format is valid!"
EOF

# Create post-commit hook
cat > "$SCRIPTS_DIR/post-commit" << 'EOF'
#!/bin/bash

# Post-commit hook for TheFox project
commit_hash=$(git rev-parse HEAD)
commit_message=$(git log -1 --pretty=%B)

echo "📝 Commit created: ${commit_hash:0:7}"

# Check if this is a deployment commit
if echo "$commit_message" | grep -q "^deploy"; then
    echo "🚀 Deployment commit detected!"
    echo "💡 To deploy:"
    echo "  - Staging: git tag release-staging-$(date +%Y%m%d-%H%M%S) && git push origin --tags"
    echo "  - Production: git tag v1.0.0 && git push origin --tags"
fi
EOF

# Make hooks executable
chmod +x "$SCRIPTS_DIR/pre-commit"
chmod +x "$SCRIPTS_DIR/commit-msg"
chmod +x "$SCRIPTS_DIR/post-commit"

# Install hooks
cp "$SCRIPTS_DIR/pre-commit" "$HOOKS_DIR/pre-commit"
cp "$SCRIPTS_DIR/commit-msg" "$HOOKS_DIR/commit-msg"
cp "$SCRIPTS_DIR/post-commit" "$HOOKS_DIR/post-commit"

echo -e "${GREEN}✅ Git hooks installed successfully!${NC}"
echo ""
echo "Installed hooks:"
echo "  - pre-commit: Runs linter and type check"
echo "  - commit-msg: Validates commit message format"
echo "  - post-commit: Shows deployment instructions"
echo ""
echo "To disable hooks temporarily: git commit --no-verify"