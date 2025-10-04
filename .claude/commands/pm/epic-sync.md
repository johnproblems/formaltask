---
allowed-tools: Bash, Read
---

# Epic Sync

Push epic and tasks to GitHub as issues.

## Usage
```
/pm:epic-sync <feature_name>
```

## Quick Check

Before syncing, verify epic and tasks exist:

```bash
# Verify epic exists
test -f .claude/epics/$ARGUMENTS/epic.md || echo "❌ Epic not found. Run: /pm:prd-parse $ARGUMENTS"

# Count task files (excluding epic.md)
task_count=$(find .claude/epics/$ARGUMENTS -name "[0-9]*.md" ! -name "epic.md" | wc -l)
echo "Found $task_count tasks to sync"
```

If no tasks found: "❌ No tasks to sync. Run: /pm:epic-decompose $ARGUMENTS"

## Instructions

This command uses a bash script that handles all sync operations reliably.

### Execute the Sync Script

Run the sync script with the epic name:

```bash
bash .claude/scripts/pm/sync-epic.sh $ARGUMENTS
```

The script will:
1. ✅ Create epic issue on GitHub
2. ✅ Create all task issues
3. ✅ Add proper labels (epic, enhancement, task, epic:$ARGUMENTS)
4. ✅ Update frontmatter in all task and epic files with GitHub URLs
5. ✅ Create github-mapping.md file
6. ✅ Display summary with epic URL

## What the Script Does

### Step 1: Create Epic Issue
- Extracts epic title from epic.md
- Strips frontmatter from epic body
- Replaces "## Tasks Created" section with "## Stats"
- Creates GitHub issue
- Captures issue number

### Step 2: Create Task Issues
- Finds all numbered task files (e.g., 001.md, 002.md, etc.)
- For each task:
  - Extracts task name from frontmatter
  - Strips frontmatter from task body
  - Creates GitHub issue
  - Records task file → issue number mapping

### Step 3: Add Labels
- Creates epic-specific label (e.g., `epic:phase-a3.2-preferences-testing`)
- Creates standard labels if needed (`task`, `epic`, `enhancement`)
- Adds `epic` + `enhancement` labels to epic issue
- Adds `task` + epic-specific label to each task issue

### Step 4: Update Frontmatter
- Updates epic.md: `github` and `updated` fields
- Updates each task .md file: `github` and `updated` fields
- Sets current UTC timestamp

### Step 5: Create GitHub Mapping
- Creates `github-mapping.md` in epic directory
- Lists epic issue number and URL
- Lists all task issue numbers, names, and URLs
- Records sync timestamp

## Output

After successful sync, you'll see:

```
✨ Sync Complete!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Epic: #XX - Epic Title
Tasks: N issues created
View: https://github.com/owner/repo/issues/XX

Next steps:
  - View epic: /pm:epic-show $ARGUMENTS
  - Start work: /pm:issue-start <task_number>
```

## Error Handling

If the script fails:
- Check that `gh` CLI is authenticated (`gh auth status`)
- Verify you have write access to the repository
- Ensure task files have valid frontmatter with `name:` field
- Check that epic.md has valid frontmatter

## Important Notes

- Task files must have frontmatter with `name:` field
- Epic must have `# Epic:` title line in body
- Script creates labels automatically (ignores "already exists" errors)
- All GitHub operations use `gh` CLI
- Frontmatter updates are done in-place with `sed`
- Script is idempotent - safe to run multiple times (will create duplicate issues though)

## Troubleshooting

**"Epic not found"**: Run `/pm:prd-parse $ARGUMENTS` first

**"No tasks to sync"**: Run `/pm:epic-decompose $ARGUMENTS` first

**Label errors**: Labels are created automatically; errors about existing labels are ignored

**"gh: command not found"**: Install GitHub CLI: `brew install gh` (macOS) or `apt install gh` (Linux)

**Authentication errors**: Run `gh auth login` to authenticate
