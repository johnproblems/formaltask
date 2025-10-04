---
allowed-tools: Bash, Read, Write, LS
---

# Issue Complete

Mark a GitHub issue as complete with proper label management and frontmatter updates.

## Usage
```
/pm:issue-complete <issue_number>
```

Example:
```
/pm:issue-complete 20
```

## Required Rules

**IMPORTANT:** Before executing this command, read and follow:
- `.claude/rules/datetime.md` - For getting real current date/time

## Preflight Checks

1. **GitHub authentication:**
   ```bash
   if ! gh auth status &>/dev/null; then
     echo "❌ GitHub CLI not authenticated. Run: gh auth login"
     exit 1
   fi
   ```

2. **Verify issue exists:**
   ```bash
   if ! gh issue view $ARGUMENTS --json state &>/dev/null; then
     echo "❌ Issue #$ARGUMENTS not found"
     exit 1
   fi
   ```

3. **Check if already closed:**
   ```bash
   issue_state=$(gh issue view $ARGUMENTS --json state --jq '.state')
   if [ "$issue_state" = "CLOSED" ]; then
     echo "⚠️  Issue #$ARGUMENTS is already closed"
     echo "Reopen with: gh issue reopen $ARGUMENTS"
     exit 0
   fi
   ```

4. **Get repository info:**
   ```bash
   REPO=$(git remote get-url origin | sed 's|.*github.com[:/]||' | sed 's|\.git$||')
   ```

## Instructions

You are marking issue #$ARGUMENTS as complete.

### 1. Find Local Task File

Search for the task file:
```bash
# Method 1: Try direct filename match (new naming)
task_file=$(find .claude/epics -name "$ARGUMENTS.md" -type f | grep -v epic.md | head -1)

# Method 2: Search frontmatter for github URL (old naming)
if [ -z "$task_file" ]; then
  task_file=$(find .claude/epics -name "*.md" -type f -exec grep -l "github:.*issues/$ARGUMENTS" {} \; | grep -v epic.md | head -1)
fi

if [ -z "$task_file" ]; then
  echo "⚠️  No local task file found for issue #$ARGUMENTS"
  echo "This issue may have been created outside the PM system"
  echo "Continuing with GitHub-only updates..."
fi
```

### 2. Create Completion Comment

Get current datetime: `date -u +"%Y-%m-%dT%H:%M:%SZ"`

Create a completion comment for GitHub:
```markdown
## ✅ Task Completed

**Completed:** {current_datetime}

All acceptance criteria have been met and the task is ready for review.

### ✓ Deliverables
- Implementation complete
- Tests passing
- Documentation updated

---
*Marked complete via CCPM*
```

Post comment:
```bash
gh issue comment $ARGUMENTS --body "$(cat <<'EOF'
## ✅ Task Completed

**Completed:** {current_datetime}

All acceptance criteria have been met and the task is ready for review.

### ✓ Deliverables
- Implementation complete
- Tests passing
- Documentation updated

---
*Marked complete via CCPM*
EOF
)"
```

### 3. Update GitHub Labels

**Create labels if needed:**
```bash
gh label create "completed" --repo "$REPO" --color "28a745" --description "Task completed and verified" 2>/dev/null || true
```

**Remove in-progress label (if exists):**
```bash
gh issue edit $ARGUMENTS --repo "$REPO" --remove-label "in-progress" 2>/dev/null || true
```

**Add completed label:**
```bash
gh issue edit $ARGUMENTS --repo "$REPO" --add-label "completed"
```

**Remove blocked label (if exists):**
```bash
gh issue edit $ARGUMENTS --repo "$REPO" --remove-label "blocked" 2>/dev/null || true
```

### 4. Close Issue

```bash
gh issue close $ARGUMENTS --repo "$REPO"
```

### 5. Update Local Task File

If task file was found, update frontmatter:

Get current datetime: `date -u +"%Y-%m-%dT%H:%M:%SZ"`

Update status and timestamp:
```bash
if [ -n "$task_file" ]; then
  sed -i "s|^status:.*|status: closed|" "$task_file"
  sed -i "s|^updated:.*|updated: $current_datetime|" "$task_file"
fi
```

### 6. Update Epic Progress

If task file exists, extract epic name and update epic:
```bash
if [ -n "$task_file" ]; then
  epic_dir=$(dirname "$task_file")
  epic_file="$epic_dir/epic.md"

  if [ -f "$epic_file" ]; then
    # Count total tasks and closed tasks
    total_tasks=$(find "$epic_dir" -name "[0-9]*.md" ! -name "epic.md" | wc -l)
    closed_tasks=$(find "$epic_dir" -name "[0-9]*.md" ! -name "epic.md" -exec grep -l "^status: closed" {} \; | wc -l)

    # Calculate progress percentage
    progress=$((closed_tasks * 100 / total_tasks))

    # Update epic frontmatter
    sed -i "s|^progress:.*|progress: ${progress}%|" "$epic_file"
    sed -i "s|^updated:.*|updated: $current_datetime|" "$epic_file"

    echo "  📊 Epic progress: ${progress}% (${closed_tasks}/${total_tasks} tasks)"
  fi
fi
```

### 7. Unblock Dependent Tasks

Find tasks that depend on this issue and check if they can be unblocked:
```bash
if [ -n "$task_file" ]; then
  epic_dir=$(dirname "$task_file")

  # Find all tasks that depend on this issue
  dependent_tasks=$(find "$epic_dir" -name "[0-9]*.md" ! -name "epic.md" -exec grep -l "depends_on:.*$ARGUMENTS" {} \;)

  for dep_task in $dependent_tasks; do
    # Extract all dependencies from this task
    all_deps=$(grep "^depends_on:" "$dep_task" | sed 's/depends_on: \[\(.*\)\]/\1/' | tr ',' ' ')

    # Check if all dependencies are now closed
    all_closed=true
    for dep in $all_deps; do
      dep_state=$(gh issue view "$dep" --repo "$REPO" --json state --jq '.state' 2>/dev/null || echo "OPEN")
      if [ "$dep_state" = "OPEN" ]; then
        all_closed=false
        break
      fi
    done

    # If all dependencies closed, remove blocked label
    if [ "$all_closed" = true ]; then
      dep_issue=$(grep "^github:.*issues/" "$dep_task" | grep -oP 'issues/\K[0-9]+')
      if [ -n "$dep_issue" ]; then
        gh issue edit "$dep_issue" --repo "$REPO" --remove-label "blocked" 2>/dev/null || true
        echo "  🚀 Unblocked issue #$dep_issue"
      fi
    fi
  done
fi
```

### 8. Update Pending Label

Find epic name and update pending label to next available task:
```bash
if [ -n "$task_file" ]; then
  epic_name=$(basename "$(dirname "$task_file")")
  bash .claude/scripts/pm/update-pending-label.sh "$epic_name"
fi
```

### 9. Output Summary

```
✅ Issue #$ARGUMENTS marked as complete

🏷️  Label Updates:
   ✓ Removed: in-progress
   ✓ Added: completed
   ✓ Issue closed

{If local task found:}
💾 Local Updates:
   ✓ Task file status: closed
   ✓ Epic progress updated: {progress}%

{If unblocked tasks:}
🚀 Unblocked Tasks:
   ✓ Issue #{dep_issue} - all dependencies complete

{If pending label moved:}
⏭️  Pending Label:
   ✓ Moved to next task: #{next_pending}

🔗 View Issue:
   https://github.com/{repo}/issues/$ARGUMENTS

📊 Epic Status:
   Completed: {closed_tasks}/{total_tasks} tasks ({progress}%)

🚀 Next Steps:
   View epic status: /pm:epic-status {epic_name}
   Start next task: /pm:issue-start {next_pending}
```

## Error Handling

**Issue Not Found:**
- Message: "❌ Issue #$ARGUMENTS not found"
- Exit cleanly

**Already Closed:**
- Message: "⚠️  Issue #$ARGUMENTS is already closed"
- Show reopen command
- Exit without error

**GitHub API Failure:**
- Attempt local updates anyway
- Warn: "⚠️  GitHub update failed but local files updated"
- Suggest retry

**No Local Task:**
- Continue with GitHub-only updates
- Warn: "⚠️  No local task file found"
- Update labels and close issue normally

## Important Notes

- Always remove in-progress and blocked labels when completing
- Always add completed label
- Update epic progress automatically
- Unblock dependent tasks automatically
- Move pending label to next available task
- Post completion comment for audit trail
- Handle cases where task has no local file (external issues)
