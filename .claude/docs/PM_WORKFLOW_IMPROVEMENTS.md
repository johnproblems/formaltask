# PM Workflow Improvements

## Changes Made

### 1. Epic Sync Command - Complete Rewrite

**Problem**: The original `/pm:epic-sync` command had complex inline bash that failed due to shell escaping issues in the Bash tool.

**Solution**: Created a dedicated bash script that handles all sync operations reliably.

**New Files**:
- `.claude/scripts/pm/sync-epic.sh` - Main sync script
- `.claude/commands/pm/epic-sync.md` - Simplified command that calls the script

**What the Script Does**:
1. Creates epic issue on GitHub
2. Creates all task issues
3. Adds proper labels:
   - Epics get: `epic` + `enhancement`
   - Tasks get: `task` + `epic:<epic-name>` (e.g., `epic:phase-a3.2-preferences-testing`)
4. Updates frontmatter in all files with GitHub URLs and timestamps
5. Creates `github-mapping.md` file with issue numbers
6. Displays summary with URLs

**Usage**:
```bash
/pm:epic-sync <epic-name>
```

The command now uses `bash .claude/scripts/pm/sync-epic.sh $ARGUMENTS` internally.

### 2. Epic Decompose - Task Count Guidance

**Problem**: The command was receiving external instructions to "limit to 10 or less tasks", causing it to consolidate tasks against the PRD estimates.

**Solution**: Added explicit guidance to use PRD/epic estimates, not arbitrary limits.

**Changes to `.claude/commands/pm/epic-decompose.md`**:
- Added "Task Count Guidance" section
- Explicitly states: **DO NOT restrict to "10 or less"**
- Instructs to use the actual estimates from PRD and epic
- Examples: "If PRD says '45-60 tasks', create 45-60 tasks"

**Key Points**:
- Review epic's "Task Breakdown Preview" section
- Review PRD's estimated task counts per component
- Create the number of tasks specified in estimates
- Goal is manageable tasks (1-3 days each), not a specific count

### 3. Epic Decompose - Task Numbering from GitHub

**Problem**: Tasks were always numbered 001.md, 002.md, etc., which didn't match their future GitHub issue numbers. This required renaming during sync.

**Solution**: Added Step 0 to query GitHub for the highest issue number and start task numbering from there.

**Changes to `.claude/commands/pm/epic-decompose.md`**:
- Added "Step 0: Determine Starting Task Number" section
- Queries GitHub for highest issue number
- Calculates: epic will be `#(highest + 1)`, tasks start at `#(highest + 2)`
- Creates task files with actual GitHub numbers (e.g., 18.md, 19.md, 20.md)
- Updated "Task Naming Convention" to emphasize using GitHub issue numbers
- Updated frontmatter examples to use actual issue numbers in dependencies

**Example**:
```bash
# Query GitHub
highest_issue=$(gh issue list --limit 100 --state all --json number --jq 'max_by(.number) | .number')
# Returns: 16

# Calculate numbering
start_number=$((highest_issue + 1))  # 17 (epic)
# Tasks start at: 18, 19, 20...

# Create files
.claude/epics/my-feature/18.md
.claude/epics/my-feature/19.md
.claude/epics/my-feature/20.md
```

**Benefits**:
- No renaming needed during sync
- Task file numbers match GitHub issue numbers exactly
- Dependencies in frontmatter use correct issue numbers
- Clearer mapping between local files and GitHub issues

## Labeling System

All issues now follow this structure:

### Epic Issues
- Labels: `epic`, `enhancement`
- Example: Epic #17, #28, #36

### Task Issues
- Labels: `task`, `epic:<epic-name>`
- Example: Task #18 has `task` + `epic:phase-a3.2-preferences-testing`

### Epic-Specific Labels
Each epic gets its own label for easy filtering:
- `epic:phase-a3.2-preferences-testing` (green)
- `epic:phase-a1-framework-testing` (red)
- `epic:phase-a2-titlebar-testing` (yellow)

**Benefit**: Click any epic label on GitHub to see all tasks for that epic.

## Workflow

### Full Workflow (PRD → Epic → Tasks → GitHub)

```bash
# 1. Create PRD
/pm:prd-new my-feature

# 2. Parse PRD into epic
/pm:prd-parse my-feature

# 3. Decompose epic into tasks (uses PRD estimates)
/pm:epic-decompose my-feature

# 4. Sync to GitHub
/pm:epic-sync my-feature
```

### What Gets Created

**After parse**:
- `.claude/epics/my-feature/epic.md`

**After decompose**:
- `.claude/epics/my-feature/18.md` (task 1 - numbered from GitHub)
- `.claude/epics/my-feature/19.md` (task 2)
- ... (as many as the PRD estimates, numbered sequentially from highest GitHub issue + 2)

**After sync**:
- GitHub epic issue (e.g., #17)
- GitHub task issues (e.g., #18, #19, #20...)
- Labels applied
- Frontmatter updated
- `github-mapping.md` created

## Testing

The new sync script was successfully tested with 3 epics:

1. **Phase A3.2** (10 tasks) - Epic #17, Tasks #18-27
2. **Phase A1** (7 tasks) - Epic #28, Tasks #29-35
3. **Phase A2** (5 tasks) - Epic #36, Tasks #37-41

All 22 tasks created successfully with proper labels and frontmatter.

## Benefits

1. **Reliability**: Bash script is much more reliable than inline bash commands
2. **Transparency**: Script shows exactly what it's doing at each step
3. **Correct Estimates**: Task counts match PRD estimates, not arbitrary limits
4. **Better Labels**: Epic-specific labels enable easy filtering
5. **Maintainability**: Script can be easily modified and tested

## Files Modified

- `.claude/commands/pm/epic-sync.md` - Rewritten to use script
- `.claude/commands/pm/epic-decompose.md` - Added task count guidance
- `.claude/scripts/pm/sync-epic.sh` - NEW: Main sync script
- `.claude/commands/pm/epic-sync-old.md` - Backup of old command

## Migration Notes

Existing epics can be re-synced with:
```bash
bash .claude/scripts/pm/sync-epic.sh <epic-name>
```

Note: This will create **new** issues; it doesn't update existing ones. Only use for new epics.
