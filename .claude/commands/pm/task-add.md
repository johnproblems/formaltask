---
allowed-tools: Bash, Read, Write, LS
---

# Task Add

Add a new task to an existing epic with interactive prompts and automatic GitHub sync.

## Usage
```
/pm:task-add <epic-name>
```

Example:
```
/pm:task-add phase-a3.2-preferences-testing
```

## Required Rules

**IMPORTANT:** Before executing this command, read and follow:
- `.claude/rules/datetime.md` - For getting real current date/time

## Preflight Checks

1. **Verify epic exists:**
   ```bash
   if [ ! -d ".claude/epics/$ARGUMENTS" ]; then
     echo "❌ Epic not found: $ARGUMENTS"
     echo "Available epics:"
     ls -1 .claude/epics/
     exit 1
   fi
   ```

2. **GitHub authentication:**
   ```bash
   if ! gh auth status &>/dev/null; then
     echo "❌ GitHub CLI not authenticated. Run: gh auth login"
     exit 1
   fi
   ```

3. **Get repository info:**
   ```bash
   REPO=$(git remote get-url origin | sed 's|.*github.com[:/]||' | sed 's|\.git$||')
   ```

## Instructions

You are adding a new task to epic: **$ARGUMENTS**

### 1. Interactive Input Collection

Prompt the user for task details (use clear, formatted prompts):

```
📝 Adding new task to epic: $ARGUMENTS

Please provide the following information:
```

**Task Title:**
- Prompt: `Task title: `
- Validate: Must not be empty
- Example: "Fix theme parser validation bug"

**Description:**
- Prompt: `Brief description: `
- Validate: Must not be empty
- Allow multi-line (user can paste)

**Estimated Effort:**
- Prompt: `Estimated effort (hours): `
- Validate: Must be positive number
- Example: "8"

**Priority:**
- Prompt: `Priority [high/medium/low]: `
- Validate: Must be one of: high, medium, low
- Default: medium

**Dependencies:**
- Prompt: `Depends on (issue numbers, comma-separated, or 'none'): `
- Example: "18,19" or "none"
- Validate: If not "none", verify each issue exists on GitHub
- Parse into array of numbers

**Blockers:**
- Prompt: `Blocks (issue numbers, comma-separated, or 'none'): `
- Example: "25" or "none"
- Validate: If not "none", verify each issue exists on GitHub
- Parse into array of numbers

### 2. Get Next GitHub Issue Number

```bash
highest_issue=$(gh issue list --repo "$REPO" --limit 100 --state all --json number --jq 'max_by(.number) | .number')
next_number=$((highest_issue + 1))

echo ""
echo "🎯 New task will be issue #$next_number"
echo ""
```

### 3. Create Task File

Create `.claude/epics/$ARGUMENTS/${next_number}.md`:

Get current datetime: `date -u +"%Y-%m-%dT%H:%M:%SZ"`

```yaml
---
name: {user_provided_title}
status: open
created: {current_datetime}
updated: {current_datetime}
priority: {user_provided_priority}
estimated_effort: {user_provided_effort}h
depends_on: [{dependency_issue_numbers}]
blocks: [{blocker_issue_numbers}]
github: ""
---

# {task_title}

{user_provided_description}

## Acceptance Criteria

- [ ] TODO: Define acceptance criteria

## Technical Notes

{Additional context about why this task was added}

## Testing Requirements

- [ ] Unit tests
- [ ] Integration tests
- [ ] Manual testing

## Related Issues

{If has dependencies, list them here with links}
```

### 4. Create GitHub Issue

Extract body from task file:
```bash
task_body=$(awk 'BEGIN{fs=0} /^---$/{fs++; next} fs==2{print}' ".claude/epics/$ARGUMENTS/${next_number}.md")
```

Create issue:
```bash
task_url=$(gh issue create --repo "$REPO" --title "{title}" --body "$task_body" 2>&1 | grep "https://github.com")
task_number=$(echo "$task_url" | grep -oP '/issues/\K[0-9]+')
```

### 5. Add Labels

Get epic label from epic directory:
```bash
epic_label="epic:${ARGUMENTS}"
```

Add labels:
```bash
# Add task and epic-specific labels
gh issue edit "$task_number" --repo "$REPO" --add-label "task,$epic_label"
```

**Check for blockers:**
If task has dependencies that are not yet complete:
```bash
# For each dependency, check if it's open
for dep in ${dependencies[@]}; do
  dep_state=$(gh issue view "$dep" --repo "$REPO" --json state --jq '.state')
  if [ "$dep_state" = "OPEN" ]; then
    # This task is blocked, add blocked label
    gh label create "blocked" --repo "$REPO" --color "d73a4a" --description "Blocked by dependencies" 2>/dev/null || true
    gh issue edit "$task_number" --repo "$REPO" --add-label "blocked"
    break
  fi
done
```

**Update pending label:**
Call the pending label management system (will implement in separate script):
```bash
bash .claude/scripts/pm/update-pending-label.sh "$ARGUMENTS"
```

### 6. Update Task Frontmatter

Update the task file with GitHub URL:
```bash
sed -i "s|^github:.*|github: $task_url|" ".claude/epics/$ARGUMENTS/${next_number}.md"
```

### 7. Update Epic Metadata

Read epic file and update:
- Increment task count in frontmatter or body
- Update `updated` timestamp
- Recalculate progress if needed

Get current datetime: `date -u +"%Y-%m-%dT%H:%M:%SZ"`

```bash
# Update epic frontmatter
sed -i "s|^updated:.*|updated: $current_datetime|" ".claude/epics/$ARGUMENTS/epic.md"
```

### 8. Update github-mapping.md

Append new task to mapping file:
```bash
# Find the line with "Synced:" and insert before it
sed -i "/^Synced:/i - #${task_number}: ${task_title} - ${task_url}" ".claude/epics/$ARGUMENTS/github-mapping.md"

# Update sync timestamp
sed -i "s|^Synced:.*|Synced: $current_datetime|" ".claude/epics/$ARGUMENTS/github-mapping.md"
```

### 9. Update Dependent/Blocked Tasks

If this task blocks other tasks (user specified blocker issues):
```bash
for blocked_issue in ${blockers[@]}; do
  # Find the task file for this issue
  blocked_file=$(find .claude/epics/$ARGUMENTS -name "*.md" -exec grep -l "github:.*issues/$blocked_issue" {} \;)

  if [ -n "$blocked_file" ]; then
    # Add this task to the depends_on array in the blocked task's frontmatter
    # (This is complex frontmatter manipulation - may need careful sed/awk)
    echo "  ℹ️  Updated task #$blocked_issue - added dependency on #$task_number"
  fi
done
```

### 10. Validation

Verify dependency issues exist and are valid:
```bash
for dep in ${dependencies[@]}; do
  if ! gh issue view "$dep" --repo "$REPO" &>/dev/null; then
    echo "⚠️  Warning: Dependency issue #$dep does not exist on GitHub"
    echo "   Task created but may need dependency correction"
  fi
done
```

### 11. Output Summary

```
✅ Task added successfully!

📋 Task Details:
   Issue: #$task_number
   Title: {task_title}
   Priority: {priority}
   Effort: {effort}h

🏷️ Labels:
   ✓ task
   ✓ epic:$ARGUMENTS
   {✓ blocked (if has open dependencies)}

🔗 Links:
   GitHub: $task_url
   Local: .claude/epics/$ARGUMENTS/${next_number}.md

📊 Epic Updated:
   Epic: $ARGUMENTS
   Updated: github-mapping.md

{If has dependencies:}
⚠️  Dependencies:
   Blocked by: #{dep1}, #{dep2}
   Task labeled as 'blocked' until dependencies complete

{If blocks other tasks:}
🚧 Blocks:
   This task blocks: #{blocked1}, #{blocked2}

🚀 Next Steps:
   View task: /pm:issue-show $task_number
   Start work: /pm:issue-start $task_number
   View epic: /pm:epic-show $ARGUMENTS
```

## Error Handling

**Invalid Epic:**
- Message: "❌ Epic not found: $ARGUMENTS"
- List available epics
- Exit cleanly

**GitHub API Failure:**
- Message: "❌ Failed to create GitHub issue: {error}"
- Keep local task file for retry
- Suggest: "Retry with: /pm:task-sync $ARGUMENTS ${next_number}"

**Dependency Validation Failure:**
- Create task anyway
- Warn about invalid dependencies
- Suggest manual review

**Label Creation Failure:**
- Continue anyway (labels may already exist)
- Warn if critical failure

## Important Notes

- Always validate user input before creating files
- Use interactive prompts, not flags, for better UX
- Automatically manage blocked label based on dependencies
- Keep epic metadata in sync
- Update github-mapping.md for audit trail
- Call pending label management after task creation
