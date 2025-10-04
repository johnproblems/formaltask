# Add Task to Epic - Design Document

## Problem Statement

After epic sync, sometimes new tasks need to be added to address:
- Issues discovered during implementation
- Additional requirements
- Subtasks that need to be split out

Currently there's no systematic way to add tasks to an existing epic and keep everything in sync.

## Requirements

1. Add new task to epic directory
2. Create GitHub issue with proper labels
3. Update epic's task count and dependencies
4. Update github-mapping.md
5. Handle task numbering correctly (use next GitHub issue number)
6. Update dependencies if needed

## Proposed Solution

### New Command: `/pm:task-add <epic-name>`

```bash
/pm:task-add phase-a3.2-preferences-testing
```

**Interactive Prompts:**
1. "Task title: " → User enters title
2. "Brief description: " → User enters description
3. "Estimated effort (hours): " → User enters estimate
4. "Priority (high/medium/low): " → User enters priority
5. "Depends on (issue numbers, comma-separated, or 'none'): " → User enters dependencies
6. "Blocks (issue numbers, comma-separated, or 'none'): " → User enters blockers

**What it does:**

1. **Get next GitHub issue number**
   ```bash
   highest_issue=$(gh issue list --repo $REPO --limit 100 --state all --json number --jq 'max_by(.number) | .number')
   next_number=$((highest_issue + 1))
   ```

2. **Create task file** `.claude/epics/<epic-name>/<next_number>.md`
   ```yaml
   ---
   name: {user_provided_title}
   status: open
   created: {current_datetime}
   updated: {current_datetime}
   priority: {user_provided_priority}
   estimated_effort: {user_provided_effort}
   depends_on: [{issue_numbers}]
   blocks: [{issue_numbers}]
   github: ""  # Will be filled after sync
   ---

   # {task_title}

   {user_provided_description}

   ## Acceptance Criteria

   - [ ] TODO: Define acceptance criteria

   ## Technical Notes

   {Additional context from issue discovery}
   ```

3. **Create GitHub issue**
   ```bash
   task_body=$(awk 'BEGIN{fs=0} /^---$/{fs++; next} fs==2{print}' "{task_file}")
   task_url=$(gh issue create --repo "$REPO" --title "{title}" --body "$task_body")
   task_number=$(echo "$task_url" | grep -oP '/issues/\K[0-9]+')
   ```

4. **Add labels**
   ```bash
   # Get epic label from epic directory name
   epic_label="epic:${epic_name}"
   gh issue edit "$task_number" --add-label "task,$epic_label"
   ```

5. **Update task frontmatter**
   ```bash
   sed -i "s|^github:.*|github: $task_url|" "$task_file"
   ```

6. **Update epic frontmatter**
   - Increment task count
   - Recalculate progress percentage
   - Update `updated` timestamp

7. **Update github-mapping.md**
   ```bash
   # Insert new task in the Tasks section
   echo "- #${task_number}: ${task_title} - ${task_url}" >> github-mapping.md
   ```

8. **Handle dependencies**
   - If task depends on others, validate those issues exist
   - If task blocks others, update those task files' frontmatter

### Alternative: Non-Interactive Version

```bash
/pm:task-add phase-a3.2-preferences-testing --title="Fix theme parser bug" --effort=4 --priority=high --depends-on=18,19
```

## Label Management Design

### New Command: `/pm:issue-complete <issue_number>`

Updates labels and closes issue:

```bash
# Remove in-progress label
gh issue edit $ARGUMENTS --remove-label "in-progress"

# Add completed label
gh label create "completed" --color "28a745" --description "Task completed" 2>/dev/null || true
gh issue edit $ARGUMENTS --add-label "completed"

# Close issue
gh issue close $ARGUMENTS --comment "✅ Task completed and verified"
```

### Enhanced `/pm:issue-start`

Already adds `in-progress` label ✅

### Enhanced `/pm:issue-sync`

**Add auto-completion detection:**

If completion reaches 100% in progress.md:
```bash
# Automatically call /pm:issue-complete
if [ "$completion" = "100" ]; then
  gh label create "completed" --color "28a745" 2>/dev/null || true
  gh issue edit $ARGUMENTS --remove-label "in-progress" --add-label "completed"
  gh issue close $ARGUMENTS --comment "✅ Task auto-completed (100% progress)"
fi
```

## Visual Monitoring Design

### GitHub Label System

**Labels for workflow states:**
- `task` - Purple (existing)
- `epic` - Blue (existing)
- `enhancement` - Light blue (existing)
- `epic:<name>` - Green/Red/Yellow (existing, epic-specific)
- `in-progress` - Yellow/Orange (NEW)
- `completed` - Green (NEW)
- `blocked` - Red (NEW)

### VSCode Extension Concept

**Features:**
1. **Issue Tree View**
   - Shows epics and tasks from `.claude/epics/`
   - Color-coded by status (in-progress = yellow, completed = green, blocked = red)
   - Click to open task file or GitHub issue
   - Shows progress percentage next to each task

2. **Progress Notes Panel**
   - Shows `.claude/epics/*/updates/<issue>/progress.md`
   - Auto-refreshes when file changes
   - Click to expand/collapse sections
   - Summarize button to get AI summary of progress

3. **Status Bar Item**
   - Shows current task being worked on
   - Click to see full task list
   - Progress bar for epic completion

4. **GitHub Sync Integration**
   - Button to run `/pm:issue-sync` for current task
   - Shows last sync time
   - Notification when sync needed (>1 hour since last update)

### Watcher Program Concept

**Standalone CLI/TUI program:**

```bash
pm-watch
```

**Features:**
1. **Live Dashboard**
   ```
   ╔══════════════════════════════════════════════════════════╗
   ║ Epic: Phase A3.2 Preferences Testing                     ║
   ║ Progress: ██████████░░░░░░░░░░ 40% (4/10 tasks)         ║
   ╠══════════════════════════════════════════════════════════╣
   ║ 🟢 #18 Preference Manager - Unit Tests    [COMPLETED]   ║
   ║ 🟢 #19 Preference Manager - Integration   [COMPLETED]   ║
   ║ 🟡 #20 Typography System - Unit Tests     [IN PROGRESS] ║
   ║    └─ Progress: 65% | Last sync: 5 mins ago             ║
   ║ ⚪ #21 Typography System - Integration    [PENDING]     ║
   ║ ⚪ #22 Window Positioning - Unit Tests    [PENDING]     ║
   ╚══════════════════════════════════════════════════════════╝

   [S] Sync current  [R] Refresh  [Q] Quit
   ```

2. **Progress Note Viewer**
   - Press number (e.g., `20`) to view progress notes for that task
   - Shows formatted markdown from progress.md
   - AI summary button

3. **Auto-refresh**
   - Polls GitHub every 30 seconds for label changes
   - Watches local files for progress updates
   - Desktop notification when task completes

## Implementation Files

### New Files to Create

1. **`.claude/commands/pm/task-add.md`** - Add task to epic command
2. **`.claude/commands/pm/issue-complete.md`** - Mark issue complete with labels
3. **`.claude/scripts/pm/task-add.sh`** - Bash script for task addition
4. **`.claude/scripts/pm/pm-watch.py`** - Python TUI watcher (optional)

### Files to Modify

1. **`.claude/commands/pm/issue-sync.md`** - Add auto-completion on 100%
2. **`.claude/commands/pm/issue-start.md`** - Already adds in-progress ✅

### VSCode Extension (Future)

Location: `vscode-extension/ccpm-monitor/`
- `package.json` - Extension manifest
- `src/extension.ts` - Main extension code
- `src/treeView.ts` - Epic/task tree view
- `src/progressPanel.ts` - Progress notes panel
- `src/githubSync.ts` - GitHub integration

## Benefits

1. **Add Tasks Easily**: No manual file creation or number tracking
2. **Label Workflow**: Visual GitHub interface shows task states
3. **Auto-sync Labels**: Completion automatically updates labels
4. **Monitoring**: External tools can watch and visualize progress
5. **Audit Trail**: All changes tracked in frontmatter and GitHub
6. **Dependencies**: Proper dependency tracking and validation

## Migration Path

1. ✅ **Phase 1**: Create `/pm:task-add` and `/pm:issue-complete` commands - **COMPLETE**
2. ✅ **Phase 2**: Add auto-completion to `/pm:issue-sync` - **COMPLETE**
3. ✅ **Phase 3**: Create `blocked` label support and pending label management - **COMPLETE**
4. ✅ **Phase 4**: Enhance `/pm:epic-status` command for terminal monitoring - **COMPLETE**
5. ✅ **Phase 5**: Design VSCode extension architecture - **COMPLETE**
6. **Phase 6**: Implement VSCode extension - **PENDING**

## Decisions Made

1. ✅ **Task-add format**: Interactive prompts (better UX than flags)
2. ✅ **Blocked label**: Automatically added when dependencies aren't met
3. ✅ **Monitoring solution**:
   - `/pm:epic-status` command for terminal (lightweight, works everywhere)
   - VSCode extension for deep IDE integration (separate repo)
   - **NO standalone TUI watcher** (redundant with VSCode extension)
4. ✅ **VSCode extension**:
   - Separate repository (not part of main project)
   - TypeScript-based (VSCode standard)
   - See [VSCODE_EXTENSION_DESIGN.md](VSCODE_EXTENSION_DESIGN.md) for full architecture
5. ✅ **CCPM additions**:
   - Push to separate branch in fork: https://github.com/johnproblems/ccpm
   - CCPM is just collection of scripts/md files, no npm package installation needed
6. ✅ **Pending label behavior**:
   - Only ONE task has `pending` label at a time
   - Label is on first non-completed, non-in-progress task
   - Label automatically moves when that task starts or completes
   - Example: Task #10 is pending → when #10 starts, label moves to #11
   - Implemented in `.claude/scripts/pm/update-pending-label.sh`

## Implementation Status

### ✅ Completed

1. **`/pm:task-add` command** - [.claude/commands/pm/task-add.md](.claude/commands/pm/task-add.md)
   - Interactive prompts for all task details
   - Auto-gets next GitHub issue number
   - Creates task file with correct numbering
   - Creates GitHub issue with proper labels
   - Updates epic metadata and github-mapping.md
   - Validates dependencies
   - Auto-adds `blocked` label if dependencies not met
   - Calls pending label management

2. **`/pm:issue-complete` command** - [.claude/commands/pm/issue-complete.md](.claude/commands/pm/issue-complete.md)
   - Removes `in-progress` label
   - Adds `completed` label (green #28a745)
   - Closes the issue
   - Updates frontmatter (task and epic)
   - Unblocks dependent tasks automatically
   - Updates pending label to next task
   - Posts completion comment

3. **Enhanced `/pm:issue-sync`** - [.claude/commands/pm/issue-sync.md](.claude/commands/pm/issue-sync.md)
   - Auto-detects 100% completion
   - Automatically calls `/pm:issue-complete` at 100%
   - Removes `in-progress` label
   - Adds `completed` label
   - Closes issue

4. **Pending label management** - [.claude/scripts/pm/update-pending-label.sh](.claude/scripts/pm/update-pending-label.sh)
   - Creates `pending` label (yellow #fbca04)
   - Finds first non-completed, non-in-progress task
   - Moves label automatically
   - Called by task-add, issue-start, and issue-complete

5. **Enhanced `/pm:epic-status`** - [.claude/scripts/pm/epic-status.sh](.claude/scripts/pm/epic-status.sh)
   - Beautiful terminal UI with box drawing
   - Shows real-time GitHub label status
   - Progress bars for epics
   - Color-coded task icons (🟢🟡🔴⏭️⚪)
   - Shows progress percentage and last sync time for in-progress tasks
   - Quick actions for starting next task
   - Tip for auto-refresh with `watch` command

6. **VSCode Extension Design** - [.claude/docs/VSCODE_EXTENSION_DESIGN.md](.claude/docs/VSCODE_EXTENSION_DESIGN.md)
   - Complete architecture document
   - TypeScript code examples
   - Epic/Task tree view design
   - Progress notes panel design
   - Status bar integration
   - Command palette integration
   - Settings configuration
   - Ready for implementation

### ⏸️ Pending

1. **Task-add bash script** (optional helper)
   - Could create `.claude/scripts/pm/task-add.sh` for complex bash logic
   - Currently command handles everything inline

2. **VSCode Extension Implementation**
   - Repository: (to be created)
   - Based on design in VSCODE_EXTENSION_DESIGN.md
   - Separate from main project

## Label System Summary

| Label | Color | Description | Auto-Applied By |
|-------|-------|-------------|-----------------|
| `epic` | Blue #3e4b9e | Epic issue | epic-sync |
| `enhancement` | Light Blue #a2eeef | Enhancement/feature | epic-sync |
| `task` | Purple #d4c5f9 | Individual task | epic-sync, task-add |
| `epic:<name>` | Green/Red/Yellow | Epic-specific label | epic-sync, task-add |
| `in-progress` | Orange #d4c5f9 | Task being worked on | issue-start |
| `completed` | Green #28a745 | Task finished | issue-complete, issue-sync (100%) |
| `blocked` | Red #d73a4a | Blocked by dependencies | task-add, issue-start |
| `pending` | Yellow #fbca04 | Next task to work on | update-pending-label.sh |
