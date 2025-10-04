#!/bin/bash
# Epic Status Display - Shows real-time status of all tasks in an epic
# Usage: ./epic-status.sh <epic-name>

set -e

epic_name="$1"

if [ -z "$epic_name" ]; then
  echo "❌ Please specify an epic name"
  echo "Usage: /pm:epic-status <epic-name>"
  echo ""
  echo "Available epics:"
  for dir in .claude/epics/*/; do
    [ -d "$dir" ] && echo "  • $(basename "$dir")"
  done
  exit 1
fi

# Epic directory and file
epic_dir=".claude/epics/$epic_name"
epic_file="$epic_dir/epic.md"

if [ ! -f "$epic_file" ]; then
  echo "❌ Epic not found: $epic_name"
  echo ""
  echo "Available epics:"
  for dir in .claude/epics/*/; do
    [ -d "$dir" ] && echo "  • $(basename "$dir")"
  done
  exit 1
fi

# Get repository info
REPO=$(git remote get-url origin 2>/dev/null | sed 's|.*github.com[:/]||' | sed 's|\.git$||' || echo "")

# Extract epic metadata
epic_title=$(grep "^# Epic:" "$epic_file" | head -1 | sed 's/^# Epic: *//' || basename "$epic_name")
epic_github=$(grep "^github:" "$epic_file" | head -1 | sed 's/^github: *//')
epic_number=$(echo "$epic_github" | grep -oP 'issues/\K[0-9]+' || echo "")

echo ""
echo "╔══════════════════════════════════════════════════════════════════════╗"
printf "║ Epic: %-62s ║\n" "$epic_title"

# Count tasks and calculate progress
total_tasks=0
completed_count=0
in_progress_count=0
blocked_count=0
pending_count=0

# First pass: count tasks
for task_file in "$epic_dir"/[0-9]*.md; do
  [ -f "$task_file" ] || continue
  ((total_tasks++))
done

if [ $total_tasks -eq 0 ]; then
  echo "║ Progress: No tasks created yet                                       ║"
  echo "╚══════════════════════════════════════════════════════════════════════╝"
  echo ""
  echo "Run: /pm:epic-decompose $epic_name"
  exit 0
fi

# Second pass: check GitHub status for each task
for task_file in "$epic_dir"/[0-9]*.md; do
  [ -f "$task_file" ] || continue

  issue_num=$(grep "^github:.*issues/" "$task_file" | grep -oP 'issues/\K[0-9]+' | head -1 || echo "")

  if [ -z "$issue_num" ] || [ -z "$REPO" ]; then
    ((pending_count++))
    continue
  fi

  # Get issue state and labels from GitHub
  issue_data=$(gh issue view "$issue_num" --repo "$REPO" --json state,labels 2>/dev/null | jq -r '{state: .state, labels: [.labels[].name]}' || echo "")

  if [ -z "$issue_data" ]; then
    ((pending_count++))
    continue
  fi

  state=$(echo "$issue_data" | jq -r '.state')
  has_completed=$(echo "$issue_data" | jq -r '.labels | contains(["completed"])')
  has_in_progress=$(echo "$issue_data" | jq -r '.labels | contains(["in-progress"])')
  has_blocked=$(echo "$issue_data" | jq -r '.labels | contains(["blocked"])')

  if [ "$state" = "CLOSED" ] || [ "$has_completed" = "true" ]; then
    ((completed_count++))
  elif [ "$has_in_progress" = "true" ]; then
    ((in_progress_count++))
  elif [ "$has_blocked" = "true" ]; then
    ((blocked_count++))
  else
    ((pending_count++))
  fi
done

# Calculate progress percentage
progress=$((completed_count * 100 / total_tasks))

# Create progress bar (20 chars)
filled=$((progress / 5))
empty=$((20 - filled))

progress_bar=""
for ((i=0; i<filled; i++)); do
  progress_bar="${progress_bar}█"
done
for ((i=0; i<empty; i++)); do
  progress_bar="${progress_bar}░"
done

printf "║ Progress: %s %3d%% (%d/%d tasks)%*s║\n" "$progress_bar" "$progress" "$completed_count" "$total_tasks" "$((29 - ${#total_tasks} - ${#completed_count}))" ""
echo "╠══════════════════════════════════════════════════════════════════════╣"

# Display task list
for task_file in "$epic_dir"/[0-9]*.md; do
  [ -f "$task_file" ] || continue

  # Get task info
  task_name=$(grep "^name:" "$task_file" | head -1 | sed 's/^name: *//')
  issue_num=$(grep "^github:.*issues/" "$task_file" | grep -oP 'issues/\K[0-9]+' | head -1 || echo "")

  if [ -z "$issue_num" ]; then
    task_num=$(basename "$task_file" .md)
    printf "║ ⚪ #%-3s %-51s [NOT SYNCED] ║\n" "$task_num" "${task_name:0:51}"
    continue
  fi

  # Get issue state and labels
  issue_data=$(gh issue view "$issue_num" --repo "$REPO" --json state,labels,updatedAt 2>/dev/null | jq -r '{state: .state, labels: [.labels[].name], updated: .updatedAt}' || echo "")

  if [ -z "$issue_data" ]; then
    printf "║ ⚪ #%-3s %-55s [PENDING] ║\n" "$issue_num" "${task_name:0:55}"
    continue
  fi

  state=$(echo "$issue_data" | jq -r '.state')
  has_completed=$(echo "$issue_data" | jq -r '.labels | contains(["completed"])')
  has_in_progress=$(echo "$issue_data" | jq -r '.labels | contains(["in-progress"])')
  has_blocked=$(echo "$issue_data" | jq -r '.labels | contains(["blocked"])')
  has_pending=$(echo "$issue_data" | jq -r '.labels | contains(["pending"])')

  # Determine status
  if [ "$state" = "CLOSED" ] || [ "$has_completed" = "true" ]; then
    status_icon="🟢"
    status_label="COMPLETED"
    max_name=50
  elif [ "$has_in_progress" = "true" ]; then
    status_icon="🟡"

    # Try to get progress from local updates
    progress_file="$epic_dir/updates/$issue_num/progress.md"
    if [ -f "$progress_file" ]; then
      completion=$(grep "^completion:" "$progress_file" 2>/dev/null | sed 's/completion: *//' | sed 's/%//' || echo "0")
      last_sync=$(grep "^last_sync:" "$progress_file" 2>/dev/null | sed 's/last_sync: *//')

      if [ -n "$last_sync" ]; then
        last_sync_epoch=$(date -d "$last_sync" +%s 2>/dev/null || echo "0")
        now_epoch=$(date +%s)
        diff_minutes=$(( (now_epoch - last_sync_epoch) / 60 ))

        if [ "$diff_minutes" -lt 60 ]; then
          time_ago="${diff_minutes}m ago"
        elif [ "$diff_minutes" -lt 1440 ]; then
          time_ago="$((diff_minutes / 60))h ago"
        else
          time_ago="$((diff_minutes / 1440))d ago"
        fi

        status_label="IN PROGRESS"
        max_name=50
        # Print task line
        printf "║ %s #%-3s %-43s [%s] ║\n" "$status_icon" "$issue_num" "${task_name:0:43}" "$status_label"
        # Print progress detail line
        printf "║    └─ Progress: %3s%% | Last sync: %-25s       ║\n" "$completion" "$time_ago"
        continue
      else
        status_label="IN PROGRESS"
      fi
    else
      status_label="IN PROGRESS"
    fi
    max_name=44
  elif [ "$has_blocked" = "true" ]; then
    status_icon="🔴"
    status_label="BLOCKED"
    max_name=50
  elif [ "$has_pending" = "true" ]; then
    status_icon="⏭️ "
    status_label="PENDING (NEXT)"
    max_name=42
  else
    status_icon="⚪"
    status_label="PENDING"
    max_name=50
  fi

  # Print task line
  printf "║ %s #%-3s %-${max_name}s [%s] ║\n" "$status_icon" "$issue_num" "${task_name:0:$max_name}" "$status_label"
done

echo "╚══════════════════════════════════════════════════════════════════════╝"
echo ""
echo "📊 Summary:"
echo "   ✅ Completed: $completed_count"
echo "   🔄 In Progress: $in_progress_count"
echo "   🚫 Blocked: $blocked_count"
echo "   ⏸️  Pending: $pending_count"
echo ""

if [ -n "$epic_github" ]; then
  echo "🔗 Links:"
  echo "   Epic: $epic_github"
  [ -n "$epic_number" ] && echo "   View: gh issue view $epic_number"
  echo ""
fi

# Find next pending task for quick start
next_pending=""
for task_file in "$epic_dir"/[0-9]*.md; do
  [ -f "$task_file" ] || continue
  issue_num=$(grep "^github:.*issues/" "$task_file" | grep -oP 'issues/\K[0-9]+' | head -1 || echo "")
  [ -z "$issue_num" ] && continue

  issue_data=$(gh issue view "$issue_num" --repo "$REPO" --json state,labels 2>/dev/null | jq -r '{state: .state, labels: [.labels[].name]}' || echo "")
  [ -z "$issue_data" ] && continue

  state=$(echo "$issue_data" | jq -r '.state')
  has_pending=$(echo "$issue_data" | jq -r '.labels | contains(["pending"])')

  if [ "$state" = "OPEN" ] && [ "$has_pending" = "true" ]; then
    next_pending="$issue_num"
    break
  fi
done

echo "🚀 Quick Actions:"
if [ -n "$next_pending" ]; then
  echo "   Start next: /pm:issue-start $next_pending"
fi
echo "   Refresh: /pm:epic-status $epic_name"
[ -n "$epic_number" ] && echo "   View all: gh issue view $epic_number --comments"
echo ""
echo "💡 Tip: Use 'watch -n 30 /pm:epic-status $epic_name' for auto-refresh"
echo ""

exit 0
