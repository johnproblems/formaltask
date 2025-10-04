# CCPM Enhanced - Claude Code Project Manager

> **Enhanced fork** of [automazeio/ccpm](https://github.com/automazeio/ccpm) with advanced task management, GitHub label automation, and VSCode integration.

## What is This?

CCPM (Claude Code Project Manager) is a project management system that runs entirely within Claude Code using slash commands. This fork adds powerful enhancements for real-world development workflows.

## Enhancements in This Fork

### 🎯 Dynamic Task Management
- **Add tasks mid-epic** when issues arise during development
- Interactive prompts for task details (no complex flags)
- Automatic GitHub issue creation with proper numbering
- Dependency tracking and validation

### 🏷️ Automated GitHub Labels
- **Auto-manages 8 label types**: epic, task, in-progress, completed, blocked, pending, epic-specific, enhancement
- Labels update automatically based on task state
- Visual workflow on GitHub (filter by label to see status)
- **Pending label** auto-moves to next available task

### ✅ Smart Auto-Completion
- Tasks auto-close when reaching 100% progress
- No manual completion needed
- Automatic label updates and dependency unblocking

### 📊 Beautiful Monitoring
- **Terminal UI** with box-drawing and progress bars
- Real-time status from GitHub labels
- Color-coded task icons (🟢🟡🔴⏭️⚪)
- Shows progress % and last sync time

### 🔧 VSCode Extension (Designed & Ready to Implement)
- Tree view with epics and tasks
- Progress notes panel with AI summarization
- Status bar integration
- Desktop notifications
- One-click actions

## Installation

### Quick Install

```bash
# Clone this enhanced fork
git clone -b enhancements https://github.com/johnproblems/formaltask.git /tmp/formaltask-enhanced

# Run installer
bash /tmp/formaltask-enhanced/install.sh

# Verify installation
/pm:help
```

### Manual Install

```bash
# 1. Clone to temporary directory
git clone -b enhancements https://github.com/johnproblems/formaltask.git /tmp/formaltask-enhanced

# 2. Copy to your project's .claude directory
cp -r /tmp/formaltask-enhanced/.claude/commands/pm /path/to/your/project/.claude/commands/
cp -r /tmp/formaltask-enhanced/.claude/scripts/pm /path/to/your/project/.claude/scripts/
cp -r /tmp/formaltask-enhanced/.claude/docs /path/to/your/project/.claude/

# 3. Make scripts executable
chmod +x /path/to/your/project/.claude/scripts/pm/*.sh

# 4. (Optional) Install VSCode extension
cd /tmp/formaltask-enhanced/vscode-extension
npm install
npm run compile
code --install-extension ccpm-monitor-*.vsix
```

## Quick Start

### 1. Initialize CCPM in Your Project

```bash
/pm:init
```

### 2. Create a PRD

```bash
/pm:prd-new my-feature
# Edit the PRD file that opens
```

### 3. Parse PRD into Epic

```bash
/pm:prd-parse my-feature
```

### 4. Decompose Epic into Tasks

```bash
/pm:epic-decompose my-feature
```

### 5. Sync to GitHub

```bash
/pm:epic-sync my-feature
```

### 6. Start Working

```bash
# View status
/pm:epic-status my-feature

# Start next task
/pm:issue-start 42

# ... do work ...

# Sync progress
/pm:issue-sync 42

# When done (or auto-completes at 100%)
/pm:issue-complete 42
```

## Enhanced Commands

### ✅ Production-Ready Commands

#### Add Task to Existing Epic
```bash
/pm:task-add <epic-name>
```
**Status**: ✅ Tested and production-ready

Interactive prompts for:
- Task title and description
- Estimated effort (hours)
- Priority (high/medium/low)
- Dependencies (issue numbers)
- Blockers (what this blocks)

**Automatically**:
- Gets next GitHub issue number
- Creates task file with correct numbering
- Creates GitHub issue with labels
- Adds `blocked` label if dependencies not met
- Updates epic metadata
- Updates pending label

#### Complete Task
```bash
/pm:issue-complete <issue_number>
```
**Status**: ✅ Tested and production-ready

**Automatically**:
- Removes `in-progress` and `blocked` labels
- Adds `completed` label (green)
- Closes GitHub issue
- Updates task and epic frontmatter
- Unblocks dependent tasks
- Moves pending label to next task
- Posts completion comment

#### Sync Progress (Enhanced)
```bash
/pm:issue-sync <issue_number>
```
**Status**: ✅ Tested and production-ready

**New**: Auto-detects 100% completion and calls `/pm:issue-complete` automatically!

#### Epic Status (Enhanced)
```bash
/pm:epic-status <epic-name>
```
**Status**: ✅ Tested and production-ready

Shows beautiful terminal UI with:
- Progress bar
- All tasks with color-coded status
- Progress % and last sync time for in-progress tasks
- Summary statistics
- Quick action suggestions

**Tip**: Use with `watch` for auto-refresh:
```bash
watch -n 30 /pm:epic-status my-feature
```

### 🧪 Experimental Commands

#### Interactive Issue Start
```bash
/pm:issue-start-interactive <issue_number>
```
**Status**: ⚠️ Experimental - Not fully tested

Launches interactive Claude Code instances in separate terminals for parallel work streams instead of background agents.

**Difference from `/pm:issue-start`**:
- ✅ Full user interaction (approve, guide, correct)
- ✅ Real-time monitoring in terminals
- ✅ Better for complex/uncertain tasks
- ⚠️ Slower (human in loop)
- ⚠️ Not fully tested yet

**Use at your own risk** - may have bugs or unexpected behavior.

## Label System

| Label | Color | Auto-Applied | Meaning |
|-------|-------|--------------|---------|
| `epic` | Blue | Epic sync | Epic issue |
| `enhancement` | Light Blue | Epic sync | New feature |
| `task` | Purple | Task sync | Individual task |
| `epic:<name>` | Varies | Task sync | Epic-specific (for filtering) |
| `in-progress` | Orange | Task start | Being worked on |
| `completed` | Green | Task complete/100% | Finished |
| `blocked` | Red | Dependencies check | Blocked by other tasks |
| `pending` | Yellow | Auto-managed | Next task to work on |

### Pending Label Behavior

Only **one** task has the `pending` label at a time. It marks the next task to work on.

**Example**:
```
#18: completed
#19: completed
#20: in-progress
#21: pending     ← Label is here (next after in-progress)
#22: (no label)
```

When #20 completes → label moves to #21
When #21 starts → label moves to #22

## Example Workflow

### Scenario: Bug Found During Development

```bash
# 1. Currently working on task #20
/pm:issue-start 20

# 2. Discover theme parser bug while working
#    Need to add new task

/pm:task-add phase-a3-preferences

# Interactive prompts:
Task title: Fix theme parser validation bug
Description: Parser fails on hex codes with alpha channel
Effort: 4
Priority: high
Depends on: 20
Blocks: none

# Output:
✅ Task #42 created
✅ Labels: task, epic:phase-a3, blocked
⚠️  Blocked by: #20 (in progress)

# 3. Finish current task
/pm:issue-sync 20
# → Auto-completes at 100%
# → Unblocks task #42
# → Moves pending label

# 4. Check status
/pm:epic-status phase-a3
# Shows #42 is now unblocked and pending

# 5. Start new task
/pm:issue-start 42
```

## VSCode Extension

**Status**: 📐 Designed, ready for implementation

### Planned Features

- **Epic/Task Tree View**: Sidebar showing all epics and tasks with status icons
- **Progress Panel**: View progress notes with AI summarization
- **Status Bar**: Shows current task and progress
- **Quick Actions**: Right-click menu for start/complete/sync
- **Notifications**: Desktop alerts when tasks complete
- **Auto-refresh**: Updates from GitHub every 30 seconds

### Implementation

The extension is **designed and architected** (see [docs/VSCODE_EXTENSION_DESIGN.md](docs/VSCODE_EXTENSION_DESIGN.md)) but not yet implemented.

To implement:
```bash
cd vscode-extension
npm install
npm run compile
# Implement features based on design doc
```

## Documentation

- [Workflow Improvements](docs/PM_WORKFLOW_IMPROVEMENTS.md) - Epic sync and decompose enhancements
- [Task Addition Design](docs/PM_ADD_TASK_DESIGN.md) - Design document for new features
- [Workflow Summary](docs/PM_WORKFLOW_SUMMARY.md) - Complete implementation guide
- [VSCode Extension Design](docs/VSCODE_EXTENSION_DESIGN.md) - Extension architecture
- [Fork File List](docs/CCPM_FORK_FILES.md) - What files are in this fork

## What's Different from Original CCPM?

### Original CCPM
- Epic → Tasks workflow
- Basic GitHub sync
- Manual task completion
- Simple status display
- No VSCode integration

### This Fork Adds
- ✅ Dynamic task addition mid-epic
- ✅ 8 automated GitHub labels
- ✅ Auto-completion at 100%
- ✅ Pending label system
- ✅ Beautiful terminal UI
- ✅ Automatic dependency management
- ✅ Enhanced epic sync (bash script)
- ✅ GitHub issue numbering in files
- ✅ Comprehensive documentation
- 🧪 Experimental: Interactive issue start
- 📐 Planned: VSCode extension

## Changelog

### v1.0.0-enhanced (2025-10-04)

**New Commands** (Production-Ready):
- `/pm:task-add` - Add tasks to existing epics
- `/pm:issue-complete` - Complete task with full automation

**Experimental Commands**:
- `/pm:issue-start-interactive` - Interactive work streams (untested)

**Enhanced Commands**:
- `/pm:issue-sync` - Auto-completion at 100%
- `/pm:epic-sync` - Reliable bash script implementation
- `/pm:epic-decompose` - GitHub numbering, no consolidation
- `/pm:epic-status` - Beautiful UI with GitHub integration

**New Scripts**:
- `update-pending-label.sh` - Pending label management

**Enhanced Scripts**:
- `sync-epic.sh` - Complete rewrite for reliability
- `epic-status.sh` - Beautiful box-drawing UI

**New Features**:
- Automated GitHub label system (8 labels)
- Pending label auto-management
- Dependency blocking/unblocking
- Epic progress tracking

**Documentation**:
- Complete workflow guides
- Design documents
- Implementation examples
- VSCode extension architecture

**Planned**:
- VSCode extension (designed, not yet implemented)

## Upstream

This fork is based on [automazeio/ccpm](https://github.com/automazeio/ccpm).

To sync with upstream:
```bash
git remote add upstream https://github.com/automazeio/ccpm.git
git fetch upstream
git merge upstream/main
```

## Contributing

Pull requests welcome! Please:

1. Fork this repo
2. Create feature branch
3. Make changes
4. Test on fresh project
5. Submit PR

## License

MIT License - Copyright (c) 2025 Ran Aroussi (Original CCPM) & FormalHosting (Enhancements)

See [LICENSE](LICENSE) file for full details.

## Support

- **Issues**: https://github.com/johnproblems/formaltask/issues
- **Discussions**: Use GitHub Discussions
- **Original CCPM**: https://github.com/automazeio/ccpm

## Credits

- **Original CCPM**: [automazeio](https://github.com/automazeio)
- **Enhancements**: [johnproblems](https://github.com/johnproblems)
- **Powered by**: [Claude Code](https://claude.com/code)

---

**Made with ❤️ and Claude Code**
