#!/bin/bash
# CCPM Enhanced - Installation Script
# Installs enhanced CCPM from johnproblems/ccpm fork

set -e

CCPM_VERSION="1.0.0-enhanced"
CCPM_REPO="https://github.com/johnproblems/ccpm.git"
CCPM_BRANCH="enhancements"

echo ""
echo "╔═══════════════════════════════════════════════════════════════════╗"
echo "║                                                                   ║"
echo "║              CCPM Enhanced Installer v${CCPM_VERSION}               ║"
echo "║                                                                   ║"
echo "║  Enhanced Claude Code Project Manager with:                      ║"
echo "║  • Dynamic task addition                                         ║"
echo "║  • Automated GitHub labels                                       ║"
echo "║  • Auto-completion at 100%                                       ║"
echo "║  • Beautiful terminal monitoring                                 ║"
echo "║                                                                   ║"
echo "╚═══════════════════════════════════════════════════════════════════╝"
echo ""

# Check if we're in a git repository
if [ ! -d ".git" ]; then
  echo "⚠️  Warning: Not in a git repository"
  echo "CCPM works best with git-based projects"
  echo ""
  read -p "Continue anyway? (y/N): " continue_install
  if [[ ! "$continue_install" =~ ^[Yy]$ ]]; then
    echo "Installation cancelled"
    exit 0
  fi
fi

# Check for .claude directory
if [ ! -d ".claude" ]; then
  echo "📁 Creating .claude directory structure..."
  mkdir -p .claude/{commands/pm,scripts/pm,docs,epics,prds}
  echo "✓ Created .claude directory"
else
  echo "✓ .claude directory exists"
fi

# Check for existing CCPM installation
if [ -f ".claude/commands/pm/help.md" ]; then
  echo ""
  echo "⚠️  Existing CCPM installation detected"
  echo ""
  read -p "Overwrite existing installation? (y/N): " overwrite
  if [[ ! "$overwrite" =~ ^[Yy]$ ]]; then
    echo "Installation cancelled"
    exit 0
  fi

  # Backup existing installation
  backup_dir=".claude/backup-$(date +%Y%m%d-%H%M%S)"
  echo "📦 Creating backup: $backup_dir"
  mkdir -p "$backup_dir"
  cp -r .claude/commands/pm "$backup_dir/" 2>/dev/null || true
  cp -r .claude/scripts/pm "$backup_dir/" 2>/dev/null || true
  cp -r .claude/docs "$backup_dir/" 2>/dev/null || true
  echo "✓ Backup created"
fi

echo ""
echo "📥 Cloning CCPM Enhanced from GitHub..."
TEMP_DIR="/tmp/ccpm-enhanced-$$"
git clone -b "$CCPM_BRANCH" --depth 1 "$CCPM_REPO" "$TEMP_DIR"

if [ ! -d "$TEMP_DIR/.claude" ]; then
  echo "❌ Error: Invalid CCPM repository structure"
  rm -rf "$TEMP_DIR"
  exit 1
fi

echo "✓ Repository cloned"
echo ""
echo "📂 Installing CCPM files..."

# Install commands
echo "  → Installing PM commands..."
cp -r "$TEMP_DIR/.claude/commands/pm/"* .claude/commands/pm/
echo "    ✓ Commands installed"

# Install scripts
echo "  → Installing PM scripts..."
cp -r "$TEMP_DIR/.claude/scripts/pm/"* .claude/scripts/pm/
chmod +x .claude/scripts/pm/*.sh
echo "    ✓ Scripts installed"

# Install documentation
echo "  → Installing documentation..."
mkdir -p .claude/docs
cp "$TEMP_DIR/.claude/docs/PM_"* .claude/docs/ 2>/dev/null || true
cp "$TEMP_DIR/.claude/docs/VSCODE_"* .claude/docs/ 2>/dev/null || true
echo "    ✓ Documentation installed"

# Copy README to .claude directory
cp "$TEMP_DIR/README.md" .claude/CCPM_README.md 2>/dev/null || true

# Clean up
rm -rf "$TEMP_DIR"
echo ""
echo "✓ Installation complete!"
echo ""

# Check for gh CLI
if ! command -v gh &> /dev/null; then
  echo "⚠️  GitHub CLI (gh) not found"
  echo ""
  echo "CCPM Enhanced requires GitHub CLI for label management."
  echo "Install it from: https://cli.github.com/"
  echo ""
else
  echo "✓ GitHub CLI (gh) found"

  # Check gh authentication
  if ! gh auth status &> /dev/null; then
    echo "⚠️  GitHub CLI not authenticated"
    echo ""
    echo "Run: gh auth login"
    echo ""
  else
    echo "✓ GitHub CLI authenticated"
  fi
fi

# Check for jq (needed for epic-status)
if ! command -v jq &> /dev/null; then
  echo "⚠️  jq not found (optional but recommended)"
  echo ""
  echo "For best epic-status experience, install jq:"
  echo "  • macOS: brew install jq"
  echo "  • Ubuntu/Debian: sudo apt-get install jq"
  echo "  • Other: https://stedolan.github.io/jq/download/"
  echo ""
else
  echo "✓ jq found"
fi

echo ""
echo "╔═══════════════════════════════════════════════════════════════════╗"
echo "║                                                                   ║"
echo "║                    Installation Complete! ✨                      ║"
echo "║                                                                   ║"
echo "╚═══════════════════════════════════════════════════════════════════╝"
echo ""
echo "🚀 Quick Start:"
echo ""
echo "  1. Initialize CCPM:"
echo "     /pm:init"
echo ""
echo "  2. Create a PRD:"
echo "     /pm:prd-new my-feature"
echo ""
echo "  3. Parse and decompose:"
echo "     /pm:prd-parse my-feature"
echo "     /pm:epic-decompose my-feature"
echo ""
echo "  4. Sync to GitHub:"
echo "     /pm:epic-sync my-feature"
echo ""
echo "  5. Start working:"
echo "     /pm:epic-status my-feature"
echo "     /pm:issue-start <issue_number>"
echo ""
echo "📚 Documentation:"
echo "  • README: .claude/CCPM_README.md"
echo "  • Workflow Guide: .claude/docs/PM_WORKFLOW_SUMMARY.md"
echo "  • Help: /pm:help"
echo ""
echo "🔧 New Features in This Fork:"
echo "  ✅ /pm:task-add <epic>       - Add tasks mid-epic"
echo "  ✅ /pm:issue-complete <num>  - Complete with auto-labels"
echo "  ✅ /pm:epic-status <epic>    - Beautiful terminal UI"
echo "  ✅ Auto-completion at 100%    - No manual closing needed"
echo "  ✅ Pending label system       - Auto-tracks next task"
echo ""
echo "🧪 Experimental:"
echo "  ⚠️  /pm:issue-start-interactive - Interactive work streams (untested)"
echo ""
echo "Happy coding! 🎉"
echo ""
