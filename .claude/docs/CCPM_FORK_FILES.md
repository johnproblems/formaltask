# CCPM Fork - Files to Include

## Files to ADD to CCPM Fork (Generic PM System)

### New Commands (Your Enhancements) - FINISHED & TESTED
```
.claude/commands/pm/task-add.md          ← NEW: Add task to epic
.claude/commands/pm/issue-complete.md    ← NEW: Complete task with labels
```

### Experimental/Unfinished Commands (EXCLUDE from CCPM fork)
```
.claude/commands/pm/issue-start-interactive.md  ← EXPERIMENTAL: Not tested, exclude
```

### Enhanced Commands (Modified)
```
.claude/commands/pm/issue-sync.md        ← MODIFIED: Auto-completion at 100%
.claude/commands/pm/epic-sync.md         ← MODIFIED: Uses bash script
.claude/commands/pm/epic-decompose.md    ← MODIFIED: GitHub numbering, no consolidation
```

### New Scripts (Your Enhancements)
```
.claude/scripts/pm/update-pending-label.sh  ← NEW: Pending label management
```

### Enhanced Scripts (Modified)
```
.claude/scripts/pm/sync-epic.sh          ← MODIFIED: Reliable sync with labels
.claude/scripts/pm/epic-status.sh        ← MODIFIED: Beautiful UI with GitHub integration
```

### Documentation (Your Additions)
```
.claude/docs/PM_WORKFLOW_IMPROVEMENTS.md  ← Documents epic-sync and decompose improvements
.claude/docs/PM_ADD_TASK_DESIGN.md        ← Design document for new features
.claude/docs/PM_WORKFLOW_SUMMARY.md       ← Implementation summary
.claude/docs/VSCODE_EXTENSION_DESIGN.md   ← VSCode extension architecture
```

### Existing PM Commands (Keep - Already in CCPM)
```
.claude/commands/pm/epic-*.md            ← All existing epic commands
.claude/commands/pm/issue-*.md           ← All existing issue commands (except new ones)
.claude/commands/pm/prd-*.md             ← All PRD commands
.claude/commands/pm/help.md
.claude/commands/pm/init.md
.claude/commands/pm/status.md
etc.
```

### Existing PM Scripts (Keep - Already in CCPM)
```
.claude/scripts/pm/*.sh                  ← All existing scripts (except new ones)
```

## Files to EXCLUDE from CCPM Fork (Project-Specific)

### Project-Specific Directories (DO NOT COPY)
```
.claude/epics/                           ← Project-specific epics
.claude/prds/                            ← Project-specific PRDs
```

### Task Master Commands (NOT part of CCPM)
```
.claude/commands/tm/**                   ← Task Master (different system)
```

### Project-Specific Commands
```
.claude/commands/code-rabbit.md          ← Project-specific
.claude/commands/context/**              ← Project-specific
.claude/commands/testing/**              ← Project-specific
.claude/commands/prompt.md               ← Project-specific
```

### Project-Specific Scripts
```
.claude/scripts/check-path-standards.sh  ← Project-specific
.claude/scripts/fix-path-standards.sh    ← Project-specific
.claude/scripts/test-and-log.sh          ← Project-specific
```

## Summary of Your CCPM Enhancements

### 1. New Features
- Dynamic task addition to existing epics (`/pm:task-add`)
- Task completion with label management (`/pm:issue-complete`)
- Auto-completion on 100% progress (enhanced `/pm:issue-sync`)
- Pending label system (auto-moving label for next task)
- Enhanced epic status display with GitHub integration

### 2. Improvements
- Reliable epic sync using bash script
- GitHub issue numbering in task files
- No artificial task consolidation
- Automatic label management (in-progress, completed, blocked, pending)
- Beautiful terminal UI for epic-status

### 3. Documentation
- Complete workflow improvements guide
- Task addition design document
- Implementation summary with examples
- VSCode extension architecture (ready to implement)

## Directory Structure for CCPM Fork

```
ccpm/
├── README.md                          ← Your custom README
├── install.sh                         ← Your custom installer
├── CHANGELOG.md                       ← Document your changes
├── .claude/
│   ├── commands/
│   │   └── pm/                       ← All PM commands (existing + yours)
│   ├── scripts/
│   │   └── pm/                       ← All PM scripts (existing + yours)
│   └── docs/
│       ├── PM_WORKFLOW_IMPROVEMENTS.md
│       ├── PM_ADD_TASK_DESIGN.md
│       ├── PM_WORKFLOW_SUMMARY.md
│       └── VSCODE_EXTENSION_DESIGN.md
└── vscode-extension/                  ← NEW: VSCode extension
    ├── package.json
    ├── tsconfig.json
    ├── README.md
    └── src/
        ├── extension.ts
        ├── epicTreeProvider.ts
        ├── progressPanel.ts
        └── ...
```

## Branch Strategy

### Main Branch (upstream/automazeio)
- Keep synced with original CCPM
- Pull updates from upstream

### Enhancement Branch (your additions)
Name: `enhancements` or `johnproblems-additions`

Contains:
- All your new commands/scripts
- All your enhanced commands/scripts
- All your documentation
- VSCode extension

### Installation
Users can install either:
1. Original CCPM: Clone from automazeio/ccpm
2. Enhanced CCPM: Clone from johnproblems/ccpm branch enhancements

## Next Steps

1. Create new branch `enhancements` in your fork
2. Copy enhanced/new files to clean CCPM directory structure
3. Create custom README documenting your additions
4. Create install script that clones from your fork
5. Set up VSCode extension directory structure
6. Push to GitHub
7. Test installation on fresh project
