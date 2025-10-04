# Changelog - CCPM Enhanced

## [1.0.0-enhanced] - 2025-10-04

### Added - Production Ready
- `/pm:task-add` - Add tasks to existing epics with interactive prompts
- `/pm:issue-complete` - Complete task with automatic label management
- Auto-completion at 100% progress in `/pm:issue-sync`
- Pending label system (auto-moving label for next task)
- Beautiful terminal UI for `/pm:epic-status`
- Automated GitHub label system (8 label types)
- Dependency blocking and unblocking automation

### Added - Experimental
- `/pm:issue-start-interactive` - Interactive work streams (untested)

### Enhanced
- `/pm:epic-sync` - Rewritten with reliable bash script
- `/pm:epic-decompose` - GitHub issue numbering, no task consolidation
- `/pm:epic-status` - Box-drawing UI with real-time GitHub integration

### Scripts
- `update-pending-label.sh` - Pending label management
- `sync-epic.sh` - Complete rewrite for reliability
- `epic-status.sh` - Beautiful terminal interface

### Documentation
- Complete workflow guides
- Design documents with architecture
- Implementation examples
- VSCode extension design

### Changed from Original CCPM
- Epic sync now uses bash script instead of inline commands
- Task files numbered by GitHub issue number (not 001, 002, etc.)
- Epic decompose uses PRD estimates (no artificial limits)
- Status display shows real-time GitHub labels

## Based On

This fork is based on [automazeio/ccpm](https://github.com/automazeio/ccpm)
