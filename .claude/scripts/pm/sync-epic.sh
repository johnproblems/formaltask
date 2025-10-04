#!/bin/bash
# Epic Sync Script - Syncs epic and tasks to GitHub Issues
# Usage: ./sync-epic.sh <epic-name>

set -e

EPIC_NAME="$1"
EPIC_DIR=".claude/epics/${EPIC_NAME}"

if [ -z "$EPIC_NAME" ]; then
  echo "❌ Usage: ./sync-epic.sh <epic-name>"
  exit 1
fi

if [ ! -d "$EPIC_DIR" ]; then
  echo "❌ Epic directory not found: $EPIC_DIR"
  exit 1
fi

# Get repo info
REPO=$(git remote get-url origin | sed 's|.*github.com[:/]||' | sed 's|\.git$||')
echo "📦 Repository: $REPO"
echo "📂 Epic: $EPIC_NAME"
echo ""

# Step 1: Create Epic Issue
echo "Creating epic issue..."
EPIC_TITLE=$(grep "^# Epic:" "$EPIC_DIR/epic.md" | head -1 | sed 's/^# Epic: //')

# Strip frontmatter and prepare body
awk 'BEGIN{fs=0} /^---$/{fs++; next} fs==2{print}' "$EPIC_DIR/epic.md" > /tmp/epic-body-raw.md

# Remove "## Tasks Created" section and replace with Stats
awk '
  /^## Tasks Created/ { in_tasks=1; next }
  /^## / && in_tasks && !/^## Tasks Created/ {
    in_tasks=0
    if (total_tasks) {
      print "## Stats"
      print ""
      print "Total tasks: " total_tasks
      print "Parallel tasks: " parallel_tasks " (can be worked on simultaneously)"
      print "Sequential tasks: " sequential_tasks " (have dependencies)"
      if (total_effort) print "Estimated total effort: " total_effort
      print ""
    }
  }
  /^Total tasks:/ && in_tasks { total_tasks = $3; next }
  /^Parallel tasks:/ && in_tasks { parallel_tasks = $3; next }
  /^Sequential tasks:/ && in_tasks { sequential_tasks = $3; next }
  /^Estimated total effort:/ && in_tasks {
    gsub(/^Estimated total effort: /, "")
    total_effort = $0
    next
  }
  !in_tasks { print }
' /tmp/epic-body-raw.md > /tmp/epic-body.md

# Create epic (without labels since they might not exist)
EPIC_URL=$(gh issue create --repo "$REPO" --title "$EPIC_TITLE" --body-file /tmp/epic-body.md 2>&1 | grep "https://github.com")
EPIC_NUMBER=$(echo "$EPIC_URL" | grep -oP '/issues/\K[0-9]+')

echo "✅ Epic created: #$EPIC_NUMBER"
echo ""

# Step 2: Create Task Issues
echo "Creating task issues..."
TASK_FILES=$(find "$EPIC_DIR" -name "[0-9]*.md" ! -name "epic.md" | sort -V)
TASK_COUNT=$(echo "$TASK_FILES" | wc -l)

echo "Found $TASK_COUNT task files"
echo ""

> /tmp/task-mapping.txt

for task_file in $TASK_FILES; do
  task_name=$(grep "^name:" "$task_file" | head -1 | sed 's/^name: //')
  awk 'BEGIN{fs=0} /^---$/{fs++; next} fs==2{print}' "$task_file" > /tmp/task-body.md

  task_url=$(gh issue create --repo "$REPO" --title "$task_name" --body-file /tmp/task-body.md 2>&1 | grep "https://github.com")
  task_number=$(echo "$task_url" | grep -oP '/issues/\K[0-9]+')

  echo "$task_file:$task_number" >> /tmp/task-mapping.txt
  echo "✓ Created #$task_number: $task_name"
done

echo ""
echo "✅ All tasks created"
echo ""

# Step 3: Add Labels
echo "Adding labels..."

# Create epic-specific label (ignore if exists)
EPIC_LABEL="epic:${EPIC_NAME}"
gh label create "$EPIC_LABEL" --repo "$REPO" --color "0e8a16" --description "Tasks for $EPIC_NAME" 2>/dev/null || true

# Create standard labels if needed (ignore if exist)
gh label create "task" --repo "$REPO" --color "d4c5f9" --description "Individual task" 2>/dev/null || true
gh label create "epic" --repo "$REPO" --color "3e4b9e" --description "Epic issue" 2>/dev/null || true
gh label create "enhancement" --repo "$REPO" --color "a2eeef" --description "New feature or request" 2>/dev/null || true

# Add labels to epic
gh issue edit "$EPIC_NUMBER" --repo "$REPO" --add-label "epic,enhancement" 2>/dev/null
echo "✓ Labeled epic #$EPIC_NUMBER"

# Add labels to tasks
while IFS=: read -r task_file task_number; do
  gh issue edit "$task_number" --repo "$REPO" --add-label "task,$EPIC_LABEL" 2>/dev/null
  echo "✓ Labeled task #$task_number"
done < /tmp/task-mapping.txt

echo ""
echo "✅ All labels applied"
echo ""

# Step 4: Update Frontmatter
echo "Updating frontmatter..."
current_date=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

# Update epic frontmatter
sed -i "s|^github:.*|github: https://github.com/$REPO/issues/$EPIC_NUMBER|" "$EPIC_DIR/epic.md"
sed -i "s|^updated:.*|updated: $current_date|" "$EPIC_DIR/epic.md"
echo "✓ Updated epic frontmatter"

# Update task frontmatter
while IFS=: read -r task_file task_number; do
  sed -i "s|^github:.*|github: https://github.com/$REPO/issues/$task_number|" "$task_file"
  sed -i "s|^updated:.*|updated: $current_date|" "$task_file"
done < /tmp/task-mapping.txt
echo "✓ Updated task frontmatter"

echo ""

# Step 5: Create GitHub Mapping File
echo "Creating GitHub mapping file..."
cat > "$EPIC_DIR/github-mapping.md" << EOF
# GitHub Issue Mapping

Epic: #${EPIC_NUMBER} - https://github.com/${REPO}/issues/${EPIC_NUMBER}

Tasks:
EOF

while IFS=: read -r task_file task_number; do
  task_name=$(grep "^name:" "$task_file" | head -1 | sed 's/^name: //')
  echo "- #${task_number}: ${task_name} - https://github.com/${REPO}/issues/${task_number}" >> "$EPIC_DIR/github-mapping.md"
done < /tmp/task-mapping.txt

echo "" >> "$EPIC_DIR/github-mapping.md"
echo "Synced: $current_date" >> "$EPIC_DIR/github-mapping.md"

echo "✅ GitHub mapping created"
echo ""

# Summary
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✨ Sync Complete!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Epic: #$EPIC_NUMBER - $EPIC_TITLE"
echo "Tasks: $TASK_COUNT issues created"
echo "View: $EPIC_URL"
echo ""
echo "Next steps:"
echo "  - View epic: /pm:epic-show $EPIC_NAME"
echo "  - Start work: /pm:issue-start <task_number>"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
