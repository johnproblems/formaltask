#!/bin/bash
# Pending Label Management Script
# Moves the 'pending' label to the first task that is not completed or in-progress
# Usage: ./update-pending-label.sh <epic-name>

set -e

EPIC_NAME="$1"
EPIC_DIR=".claude/epics/${EPIC_NAME}"

if [ -z "$EPIC_NAME" ]; then
  echo "❌ Usage: ./update-pending-label.sh <epic-name>"
  exit 1
fi

if [ ! -d "$EPIC_DIR" ]; then
  echo "❌ Epic directory not found: $EPIC_DIR"
  exit 1
fi

# Get repo info
REPO=$(git remote get-url origin | sed 's|.*github.com[:/]||' | sed 's|\.git$||')

# Find all task files (numbered .md files, excluding epic.md)
TASK_FILES=$(find "$EPIC_DIR" -name "[0-9]*.md" ! -name "epic.md" -type f | sort -V)

if [ -z "$TASK_FILES" ]; then
  echo "No tasks found in epic: $EPIC_NAME"
  exit 0
fi

# Create pending label if it doesn't exist
gh label create "pending" --repo "$REPO" --color "fbca04" --description "Next task to work on" 2>/dev/null || true

# Find current task with pending label
current_pending=$(gh issue list --repo "$REPO" --label "pending" --json number --jq '.[0].number' 2>/dev/null || echo "")

# Find the next task that should have pending label
next_pending=""

for task_file in $TASK_FILES; do
  # Extract issue number from github URL in frontmatter
  issue_num=$(grep "^github:.*issues/" "$task_file" | grep -oP 'issues/\K[0-9]+' | head -1)

  if [ -z "$issue_num" ]; then
    # No GitHub issue yet, skip
    continue
  fi

  # Check issue state on GitHub
  issue_state=$(gh issue view "$issue_num" --repo "$REPO" --json state,labels --jq '{state: .state, labels: [.labels[].name]}' 2>/dev/null || echo "")

  if [ -z "$issue_state" ]; then
    continue
  fi

  # Parse state and labels
  state=$(echo "$issue_state" | jq -r '.state')
  has_completed=$(echo "$issue_state" | jq -r '.labels | contains(["completed"])')
  has_in_progress=$(echo "$issue_state" | jq -r '.labels | contains(["in-progress"])')

  # If this task is open and not completed and not in-progress, it's our next pending
  if [ "$state" = "OPEN" ] && [ "$has_completed" = "false" ] && [ "$has_in_progress" = "false" ]; then
    next_pending="$issue_num"
    break
  fi
done

# If we found a next pending task
if [ -n "$next_pending" ]; then
  # If it's different from current pending, update labels
  if [ "$next_pending" != "$current_pending" ]; then
    # Remove pending from old task
    if [ -n "$current_pending" ]; then
      gh issue edit "$current_pending" --repo "$REPO" --remove-label "pending" 2>/dev/null || true
      echo "  ℹ️  Removed pending label from #$current_pending"
    fi

    # Add pending to new task
    gh issue edit "$next_pending" --repo "$REPO" --add-label "pending" 2>/dev/null || true
    echo "  ✓ Added pending label to #$next_pending"
  else
    echo "  ℹ️  Pending label already on correct task: #$next_pending"
  fi
else
  # No pending tasks found (all tasks done or in progress)
  if [ -n "$current_pending" ]; then
    # Remove pending from old task
    gh issue edit "$current_pending" --repo "$REPO" --remove-label "pending" 2>/dev/null || true
    echo "  ✓ All tasks complete or in progress - removed pending label"
  else
    echo "  ℹ️  No pending tasks (all done or in progress)"
  fi
fi
