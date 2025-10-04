---
name: vscode-extension
status: backlog
created: 2025-10-04T12:11:36Z
progress: 0%
prd: .claude/prds/vscode-extension.md
github: https://github.com/johnproblems/ccpm/issues/1
---

# Epic: CCPM Monitor - VSCode Extension

## Overview
Build a VSCode extension that provides visual task management for CCPM directly in the IDE. The extension leverages existing CCPM CLI commands and file structure rather than duplicating logic, acting as a UI layer over the existing system.

## Architecture Decisions

### Core Principle: Leverage Existing CCPM System
- **Do NOT duplicate CLI logic** - Use existing `/pm:*` commands via VSCode terminal integration
- **Read-only file system access** - Extension only reads `.claude/epics/` structure; writes happen via CLI commands
- **GitHub API integration** - Use existing GitHub CLI (`gh`) for label checks, not custom API client
- **Markdown rendering** - Use `marked.js` for progress.md display (only external dependency beyond VSCode types)

### Technology Choices
- **Language**: TypeScript (VSCode standard)
- **Framework**: VSCode Extension API >= 1.80.0
- **Dependencies**: Minimal - only `marked.js` for markdown, VSCode types
- **Build**: Standard npm/webpack toolchain
- **Testing**: VSCode Test Runner, Mocha, Sinon (90-92% coverage target)

### Design Patterns
- **TreeDataProvider pattern** - For epic/task hierarchy
- **Webview panels** - For progress note display with markdown rendering
- **Event-driven updates** - FileSystemWatcher for `.claude/epics/` changes
- **Command proxying** - VSCode commands invoke CCPM CLI, don't reimplement

## Technical Approach

### Frontend Components

**1. Epic/Task Tree View (Main UI)**
- Custom TreeDataProvider reading `.claude/epics/` directory structure
- Parse epic frontmatter and task frontmatter for status/progress
- FileSystemWatcher for auto-refresh on file changes
- GitHub label polling (configurable interval, cached) for status icons
- Click handlers to open task files

**2. Progress Panel (Webview)**
- Webview panel with `marked.js` rendering progress.md
- Update on tree selection change
- Buttons invoke CLI commands via integrated terminal
- Show last sync timestamp from file mtime

**3. Status Bar Item**
- Display current task info (from active editor or tree selection)
- Quick Pick menu for common actions
- No complex logic - just UI triggers for CLI commands

**4. Settings UI**
- Standard VSCode settings contribution
- Auto-refresh interval, notification preferences, display options
- GitHub token stored in VSCode SecretStorage

### Backend Services

**No Custom Backend** - Extension is purely frontend:
- **File reading**: Native Node.js `fs` module
- **Command execution**: `vscode.window.createTerminal().sendText('/pm:...')`
- **GitHub label checks**: Invoke `gh api` via terminal, parse stdout
- **Data models**: Simple TypeScript interfaces for epic/task frontmatter parsing

### Infrastructure

**Development**:
- Standard VSCode extension development workflow
- `vsce package` for .vsix generation
- Local testing with Extension Development Host

**Testing**:
- Unit tests: Pure functions (frontmatter parsing, formatting, validators)
- Integration tests: VSCode API contracts (TreeDataProvider, commands)
- E2E tests: Critical workflows (open task → view progress → sync)
- Mock file system, GitHub calls, VSCode APIs

**Distribution**:
- Publish to VSCode Marketplace
- Auto-update via marketplace
- Minimal system requirements (just needs CCPM installed in workspace)

## Implementation Strategy

### Development Approach
1. **Start with tree view** - Core value is visualizing epics/tasks
2. **Add progress panel** - Second highest value feature
3. **Layer on commands & status bar** - Convenience features
4. **Polish with notifications & settings** - Nice-to-haves

### Risk Mitigation
- **GitHub rate limits**: Cache responses (5 min TTL), use user tokens, gracefully degrade
- **File watching performance**: Debounce (500ms), use VSCode's built-in watcher
- **Test coverage**: Enforce 90% gates in CI, behavioral testing approach

### Testing Approach
- **70% unit tests**: Pure functions (parsing, formatting, validation)
- **25% integration tests**: VSCode API integration, file watching
- **5% E2E tests**: Critical user workflows
- **Behavioral assertions**: Test what code does, not how it does it
- **Mock externals**: File system, GitHub API, VSCode APIs

## Task Breakdown Structure

**Target: 64 tasks** (1-3 days each, based on PRD estimates)

### 1. Project Setup & Infrastructure (5 tasks)
- [ ] Initialize extension project with TypeScript + webpack config
- [ ] Configure testing infrastructure (Mocha, Sinon, nyc)
- [ ] Setup CI/CD pipeline with coverage gates (90%+ enforcement)
- [ ] Create package.json with all dependencies and scripts
- [ ] Configure VSCode extension manifest (package.json extension fields)

### 2. Core Data Layer (6 tasks)
- [ ] Create TypeScript interfaces for Epic/Task frontmatter
- [ ] Implement frontmatter parser (YAML parsing with validation)
- [ ] Implement file system watcher for `.claude/epics/` directory
- [ ] Create Epic data provider service (read epic.md files)
- [ ] Create Task data provider service (read task .md files)
- [ ] Add caching layer for file reads (5 min TTL, performance optimization)

### 3. Tree View Component (7 tasks)
- [ ] Implement TreeDataProvider for Epic/Task hierarchy
- [ ] Create TreeItem classes for Epic and Task nodes
- [ ] Add status icons (🟢🟡🔴⏭️⚪) based on task status
- [ ] Implement progress percentage display for epics
- [ ] Add click handler to open task files in editor
- [ ] Implement tree refresh on file system changes (debounced 500ms)
- [ ] Add GitHub label integration (gh api calls + caching)

### 4. Progress Panel (6 tasks)
- [ ] Create webview panel provider for progress notes
- [ ] Implement markdown rendering with marked.js (with XSS sanitization)
- [ ] Add CSS styling for progress panel
- [ ] Implement task selection handler (tree → panel sync)
- [ ] Create "Sync to GitHub" button with terminal integration
- [ ] Implement auto-refresh on progress.md file changes (debounced 500ms)

### 5. Command Palette Integration (8 tasks)
- [ ] Implement "CCPM: Show Epic Status" command
- [ ] Implement "CCPM: Add Task" command (opens terminal)
- [ ] Implement "CCPM: Start Next Task" command
- [ ] Implement "CCPM: Complete Current Task" command
- [ ] Implement "CCPM: Sync Progress" command
- [ ] Implement "CCPM: Refresh All" command
- [ ] Implement "CCPM: View on GitHub" command
- [ ] Implement "CCPM: Copy Issue Number" command (clipboard API)

### 6. Status Bar Integration (4 tasks)
- [ ] Create status bar item with current task info
- [ ] Implement status text formatting logic
- [ ] Create Quick Pick menu with actions
- [ ] Add status bar update on task selection changes

### 7. Context Menu Actions (4 tasks)
- [ ] Register context menu contributions in package.json
- [ ] Implement context menu command handlers (7 actions)
- [ ] Add menu visibility logic (epic vs task items)
- [ ] Implement action enablement based on item state

### 8. Hover Tooltips (3 tasks)
- [ ] Create HoverProvider for tree items
- [ ] Implement tooltip markdown generation (7 required fields)
- [ ] Register hover provider with VSCode

### 9. Notifications (3 tasks)
- [ ] Implement notification manager service
- [ ] Add event listeners for notification triggers (4 event types)
- [ ] Implement notification debouncing logic (5 min per task)

### 10. Settings & Configuration (4 tasks)
- [ ] Define configuration schema in package.json (7 settings)
- [ ] Implement settings manager service with validation
- [ ] Add GitHub token SecretStorage integration (encrypted)
- [ ] Implement settings change listeners (hot reload)

### 11. Testing Suite (10 tasks)
- [ ] Unit tests: Frontmatter parser (90% coverage target)
- [ ] Unit tests: Data providers (Epic/Task services, 90% coverage)
- [ ] Unit tests: Status bar formatter and logic (90% coverage)
- [ ] Unit tests: Command validation and error handling (90% coverage)
- [ ] Integration tests: TreeDataProvider + VSCode API (90% coverage)
- [ ] Integration tests: Progress panel + webview (90% coverage)
- [ ] Integration tests: File watcher integration (90% coverage)
- [ ] Integration tests: GitHub API mocking and caching
- [ ] E2E test: Full workflow (open epic → expand → click task → view/sync progress)
- [ ] Setup coverage reporting and CI gates (enforce 90-92% line coverage)

### 12. Documentation & Publishing (4 tasks)
- [ ] Create README with installation, usage, and screenshots
- [ ] Add demo GIFs for key features (tree view, progress panel, commands)
- [ ] Create VSCode marketplace listing (description, icon, banner, categories)
- [ ] Configure VSCE packaging and publishing workflow

**Total: 64 tasks** (matches PRD estimate of 64-86 implementation hours + 56-74 testing hours)

## Dependencies

**Runtime**:
- VSCode >= 1.80.0
- Node.js >= 22.x (LTS with latest features)
- CCPM system installed in workspace
- GitHub CLI (`gh`) configured

**Development**:
- TypeScript >= 5.0
- marked.js (markdown rendering)
- @types/vscode, @types/node
- Mocha, Chai, Sinon (testing)
- nyc (coverage)

## Success Criteria (Technical)

**Performance**:
- Tree view loads < 500ms for 100 tasks
- Progress panel renders < 200ms
- No UI freezing during operations

**Quality**:
- 90-92% line coverage
- 88-90% branch coverage
- 90-95% function coverage
- All E2E workflows pass

**Functionality**:
- All 8 features from PRD working
- Graceful error handling (network failures, missing files)
- Consistent with VSCode UI patterns

## Estimated Effort

**Implementation**: 64-86 hours
- Tree view + GitHub integration: 16-20h
- Progress panel: 12-16h
- Commands: 8-12h
- Status bar: 8-10h
- Tooltips: 6-8h
- Context menu: 6-8h
- Notifications: 4-6h
- Settings: 4-6h

**Testing**: 56-74 hours
- Unit/Integration tests: 48-62h
- E2E tests: 8-12h

**Total**: 120-160 hours (6 weeks)

**Critical Path**:
1. Tree view (core value)
2. Progress panel (high value)
3. Testing to 90% coverage (quality gate)
4. Commands & polish (complete UX)

## Tasks Created

### 1. Project Setup & Infrastructure (Tasks 2-6)
- [ ] 2.md - Initialize extension project with TypeScript + webpack config
- [ ] 3.md - Configure testing infrastructure (Mocha, Sinon, nyc)
- [ ] 4.md - Setup CI/CD pipeline with coverage gates (90%+ enforcement)
- [ ] 5.md - Create package.json with all dependencies and scripts
- [ ] 6.md - Configure VSCode extension manifest (package.json extension fields)

### 2. Core Data Layer (Tasks 7-12)
- [ ] 7.md - Create TypeScript interfaces for Epic/Task frontmatter
- [ ] 8.md - Implement frontmatter parser (YAML parsing with validation)
- [ ] 9.md - Implement file system watcher for `.claude/epics/` directory
- [ ] 10.md - Create Epic data provider service (read epic.md files)
- [ ] 11.md - Create Task data provider service (read task .md files)
- [ ] 12.md - Add caching layer for file reads (5 min TTL, performance optimization)

### 3. Tree View Component (Tasks 13-19)
- [ ] 13.md - Implement TreeDataProvider for Epic/Task hierarchy
- [ ] 14.md - Create TreeItem classes for Epic and Task nodes
- [ ] 15.md - Add status icons (🟢🟡🔴⏭️⚪) based on task status
- [ ] 16.md - Implement progress percentage display for epics
- [ ] 17.md - Add click handler to open task files in editor
- [ ] 18.md - Implement tree refresh on file system changes (debounced 500ms)
- [ ] 19.md - Add GitHub label integration (gh api calls + caching)

### 4. Progress Panel (Tasks 20-25)
- [ ] 20.md - Create webview panel provider for progress notes
- [ ] 21.md - Implement markdown rendering with marked.js (with XSS sanitization)
- [ ] 22.md - Add CSS styling for progress panel
- [ ] 23.md - Implement task selection handler (tree → panel sync)
- [ ] 24.md - Create "Sync to GitHub" button with terminal integration
- [ ] 25.md - Implement auto-refresh on progress.md file changes (debounced 500ms)

### 5. Command Palette Integration (Tasks 26-33)
- [ ] 26.md - Implement "CCPM: Show Epic Status" command
- [ ] 27.md - Implement "CCPM: Add Task" command (opens terminal)
- [ ] 28.md - Implement "CCPM: Start Next Task" command
- [ ] 29.md - Implement "CCPM: Complete Current Task" command
- [ ] 30.md - Implement "CCPM: Sync Progress" command
- [ ] 31.md - Implement "CCPM: Refresh All" command
- [ ] 32.md - Implement "CCPM: View on GitHub" command
- [ ] 33.md - Implement "CCPM: Copy Issue Number" command (clipboard API)

### 6. Status Bar Integration (Tasks 34-37)
- [ ] 34.md - Create status bar item with current task info
- [ ] 35.md - Implement status text formatting logic
- [ ] 36.md - Create Quick Pick menu with actions
- [ ] 37.md - Add status bar update on task selection changes

### 7. Context Menu Actions (Tasks 38-41)
- [ ] 38.md - Register context menu contributions in package.json
- [ ] 39.md - Implement context menu command handlers (7 actions)
- [ ] 40.md - Add menu visibility logic (epic vs task items)
- [ ] 41.md - Implement action enablement based on item state

### 8. Hover Tooltips (Tasks 42-44)
- [ ] 42.md - Create HoverProvider for tree items
- [ ] 43.md - Implement tooltip markdown generation (7 required fields)
- [ ] 44.md - Register hover provider with VSCode

### 9. Notifications (Tasks 45-47)
- [ ] 45.md - Implement notification manager service
- [ ] 46.md - Add event listeners for notification triggers (4 event types)
- [ ] 47.md - Implement notification debouncing logic (5 min per task)

### 10. Settings & Configuration (Tasks 48-51)
- [ ] 48.md - Define configuration schema in package.json (7 settings)
- [ ] 49.md - Implement settings manager service with validation
- [ ] 50.md - Add GitHub token SecretStorage integration (encrypted)
- [ ] 51.md - Implement settings change listeners (hot reload)

### 11. Testing Suite (Tasks 52-61)
- [ ] 52.md - Unit tests: Frontmatter parser (90% coverage target)
- [ ] 53.md - Unit tests: Data providers (Epic/Task services, 90% coverage)
- [ ] 54.md - Unit tests: Status bar formatter and logic (90% coverage)
- [ ] 55.md - Unit tests: Command validation and error handling (90% coverage)
- [ ] 56.md - Integration tests: TreeDataProvider + VSCode API (90% coverage)
- [ ] 57.md - Integration tests: Progress panel + webview (90% coverage)
- [ ] 58.md - Integration tests: File watcher integration (90% coverage)
- [ ] 59.md - Integration tests: GitHub API mocking and caching
- [ ] 60.md - E2E test: Full workflow (open epic → expand → click task → view/sync progress)
- [ ] 61.md - Setup coverage reporting and CI gates (enforce 90-92% line coverage)

### 12. Documentation & Publishing (Tasks 62-65)
- [ ] 62.md - Create README with installation, usage, and screenshots
- [ ] 63.md - Add demo GIFs for key features (tree view, progress panel, commands)
- [ ] 64.md - Create VSCode marketplace listing (description, icon, banner, categories)
- [ ] 65.md - Configure VSCE packaging and publishing workflow

**Total tasks**: 64
**Parallel tasks**: ~35
**Sequential tasks**: ~29
**Estimated total effort**: 120-160 hours

