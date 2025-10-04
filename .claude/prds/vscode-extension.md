# PRD: CCPM Monitor - VSCode Extension

## Overview

Build a VSCode extension that provides deep integration with the Claude Code Project Manager (CCPM) system, offering visual task management, progress monitoring, and quick access to PM commands directly within the IDE.

## Goals

1. Provide visual representation of epics and tasks in VSCode sidebar
2. Enable one-click actions for common PM operations
3. Display real-time progress notes and status
4. Reduce context switching between terminal and IDE
5. Make CCPM more accessible to developers who prefer GUI

## Target Users

- Developers using CCPM for project management
- Teams working with Claude Code
- Users who prefer visual task management over CLI

## Success Metrics

- 80%+ of CCPM users install the extension
- 50% reduction in terminal command usage for common operations
- Positive feedback on usability and time savings
- 90-92% test coverage across all components

## Technical Stack

- **Language**: TypeScript (VSCode standard)
- **Framework**: VSCode Extension API (>= 1.80.0)
- **Dependencies**: marked.js (markdown rendering), @types/vscode, @types/node
- **Build**: npm/webpack
- **Testing**: VSCode Extension Test Runner, Mocha, Sinon (mocks)
- **Coverage Tool**: nyc (Istanbul)

## Testing Standards

Following projecttask TESTING_STANDARDS.md:

### Coverage Targets
| Metric | Target | Rationale |
|--------|--------|-----------|
| **Line Coverage** | 90-92% | Validates all code paths |
| **Branch Coverage** | 88-90% | Ensures conditional logic tested |
| **Function Coverage** | 90-95% | Confirms all APIs tested |
| **Integration Points** | 90-95% | Critical for VSCode integration |

### Test Distribution (Testing Pyramid)
- **70% Unit Tests**: Pure functions, data providers, state management
- **25% Integration Tests**: VSCode API integration, file watching, GitHub calls
- **5% E2E Tests**: Critical user workflows (open task → edit → sync)

### Testing Approach
- **Behavioral Assertions**: Test what code does, not how
- **No Implementation Details**: Avoid testing internal state
- **Mock External Dependencies**: GitHub API, File System, VSCode APIs

## Core Features

### Feature 1: Epic/Task Tree View

**Description**: Activity bar sidebar showing hierarchical view of all epics and tasks

**Requirements**:
- Display all epics from `.claude/epics/` directory
- Show tasks nested under each epic
- Color-coded status icons (🟢🟡🔴⏭️⚪)
- Progress percentage display for epics
- Click task to open task file
- Right-click menu for actions
- Auto-refresh on file changes and GitHub updates (configurable interval)

**Acceptance Criteria**:
- ✅ Tree view appears in activity bar with CCPM icon
- ✅ Epics are collapsible/expandable
- ✅ Icons update based on GitHub labels within 2 seconds
- ✅ Click opens correct task file in editor
- ✅ Right-click shows context menu with 7+ actions
- ✅ Refreshes automatically without UI freeze
- ✅ Handles missing `.claude/epics/` gracefully

**Test Strategy**:

**Unit Tests (70%)** - 85% line coverage:
```typescript
describe('EpicTreeProvider', () => {
  it('should return empty array when no epics exist', async () => {
    // Behavioral: Tests observable outcome
    const provider = new EpicTreeProvider('/fake/workspace');
    const children = await provider.getChildren();
    expect(children).toEqual([]);
  });

  it('should parse epic frontmatter correctly', async () => {
    // Behavioral: Tests data transformation
    const epic = await provider.parseEpic('epic.md');
    expect(epic.progress).toBe(40);
    expect(epic.status).toBe('in-progress');
  });
});
```

**Integration Tests (25%)** - 90% coverage of VSCode integration:
```typescript
describe('Tree View Integration', () => {
  it('should register tree view with VSCode API', () => {
    // Tests VSCode API contract
    const provider = new EpicTreeProvider(workspace);
    vscode.window.registerTreeDataProvider('ccpmEpics', provider);
    expect(vscode.window.createTreeView).toHaveBeenCalled();
  });

  it('should refresh tree when file changes', async () => {
    // Tests file watcher integration
    const provider = new EpicTreeProvider(workspace);
    fs.writeFileSync('epic.md', 'updated content');
    await waitForRefresh();
    expect(provider.onDidChangeTreeData).toHaveBeenCalled();
  });
});
```

**E2E Tests (5%)**:
```typescript
it('should complete full workflow: expand epic → click task → open file', async () => {
  // Simulates user interaction
  await treeView.expandEpic('phase-a1');
  await treeView.clickTask(18);
  expect(vscode.window.activeTextEditor.document.fileName).toContain('18.md');
});
```

**Estimated Effort**: 16-20 hours

---

### Feature 2: Progress Notes Panel

**Description**: Bottom panel showing progress.md content for selected task with markdown rendering

**Requirements**:
- Display in panel area (alongside Terminal/Problems)
- Render markdown with syntax highlighting
- Auto-select when task clicked in tree view
- Show "Last synced: X ago" timestamp
- Buttons: Sync to GitHub, Edit, AI Summarize
- Auto-refresh when progress.md changes (debounced)
- Collapsible sections

**Acceptance Criteria**:
- ✅ Panel appears in bottom panel area
- ✅ Markdown renders correctly (headers, code blocks, lists)
- ✅ Clicking task in tree shows its progress within 500ms
- ✅ Sync button runs `/pm:issue-sync` and shows output
- ✅ Edit button opens progress.md in editor
- ✅ Auto-refreshes on file changes (debounced 500ms)
- ✅ Shows placeholder when no task selected
- ✅ Handles missing progress.md gracefully

**Test Strategy**:

**Unit Tests (70%)** - 90% line coverage:
```typescript
describe('ProgressPanel', () => {
  it('should render markdown to HTML correctly', () => {
    // Behavioral: Tests output format
    const html = panel.renderMarkdown('## Test\n- Item 1');
    expect(html).toContain('<h2>Test</h2>');
    expect(html).toContain('<li>Item 1</li>');
  });

  it('should calculate time since last sync correctly', () => {
    // Behavioral: Tests business logic
    const lastSync = new Date(Date.now() - 300000); // 5 min ago
    expect(panel.formatLastSync(lastSync)).toBe('5m ago');
  });
});
```

**Integration Tests (25%)**:
```typescript
describe('Progress Panel Integration', () => {
  it('should update when task selection changes', async () => {
    // Tests component communication
    treeView.selectTask(20);
    await waitForUpdate();
    expect(panel.currentTask).toBe(20);
    expect(panel.content).toContain('Typography System');
  });

  it('should invoke sync command when button clicked', async () => {
    // Tests VSCode terminal integration
    await panel.clickSyncButton();
    expect(terminal.sendText).toHaveBeenCalledWith('/pm:issue-sync 20');
  });
});
```

**E2E Tests (5%)**:
```typescript
it('should sync progress and update panel', async () => {
  // Full workflow
  await panel.clickSyncButton();
  await waitForSync();
  expect(panel.lastSyncTimestamp).toBeRecent();
});
```

**Estimated Effort**: 12-16 hours

---

### Feature 3: Status Bar Integration

**Description**: Status bar item showing current task and progress

**Requirements**:
- Display in right side of status bar
- Format: "$(icon) CCPM: Task #X (Y%) | Epic: Z%"
- Pulsing icon when task in progress
- Click to open Quick Pick menu
- Quick Pick options: View Task, Sync Progress, Complete Task, Switch Task
- Updates when task selection changes

**Acceptance Criteria**:
- ✅ Status bar item visible and correctly positioned
- ✅ Shows current task info with correct formatting
- ✅ Icon animates for in-progress tasks
- ✅ Quick Pick menu appears on click
- ✅ All Quick Pick actions execute correctly
- ✅ Updates in real-time (< 1 second lag)
- ✅ Handles no active task gracefully

**Test Strategy**:

**Unit Tests (70%)**:
```typescript
describe('StatusBarManager', () => {
  it('should format status text correctly', () => {
    // Behavioral: Tests output format
    const text = statusBar.formatStatusText(20, 65, 40);
    expect(text).toBe('$(pulse) CCPM: Task #20 (65%) | Epic: 40%');
  });

  it('should select correct icon for task status', () => {
    // Behavioral: Tests business rule
    expect(statusBar.getIconForStatus('in-progress')).toBe('pulse');
    expect(statusBar.getIconForStatus('completed')).toBe('check');
  });
});
```

**Integration Tests (25%)**:
```typescript
describe('Status Bar Integration', () => {
  it('should register with VSCode API', () => {
    const statusBar = new StatusBarManager();
    expect(vscode.window.createStatusBarItem).toHaveBeenCalled();
  });

  it('should show Quick Pick on click', async () => {
    await statusBar.onClick();
    expect(vscode.window.showQuickPick).toHaveBeenCalled();
  });
});
```

**Estimated Effort**: 8-10 hours

---

### Feature 4: Command Palette Integration

**Description**: All PM commands available via Command Palette

**Requirements**:
- Register 8 major CCPM commands
- Commands: Show Epic Status, Add Task, Start Next, Complete Current, Sync Progress, Refresh All, View on GitHub, Copy Issue Number
- Each command properly scoped and functional
- Error handling with user-friendly messages
- Keyboard shortcuts (configurable)

**Acceptance Criteria**:
- ✅ All 8 commands appear in Command Palette with "CCPM:" prefix
- ✅ Commands execute correctly
- ✅ Commands handle errors gracefully with toast notifications
- ✅ Commands show success/failure feedback
- ✅ Commands disabled when not applicable
- ✅ Keyboard shortcuts work (configurable)

**Test Strategy**:

**Unit Tests (70%)**:
```typescript
describe('Commands', () => {
  it('should validate epic exists before showing status', async () => {
    // Behavioral: Tests validation logic
    await expect(commands.showEpicStatus('nonexistent')).rejects.toThrow('Epic not found');
  });

  it('should format GitHub URL correctly', () => {
    // Behavioral: Tests URL generation
    const url = commands.getGitHubUrl(20);
    expect(url).toBe('https://github.com/user/repo/issues/20');
  });
});
```

**Integration Tests (25%)**:
```typescript
describe('Command Integration', () => {
  it('should execute terminal command', async () => {
    await commands.syncProgress(20);
    expect(terminal.sendText).toHaveBeenCalledWith('/pm:issue-sync 20');
  });

  it('should show toast on error', async () => {
    await commands.showEpicStatus('bad-epic');
    expect(vscode.window.showErrorMessage).toHaveBeenCalled();
  });
});
```

**Estimated Effort**: 8-12 hours

---

### Feature 5: Hover Tooltips

**Description**: Rich tooltips when hovering over tasks in tree view

**Requirements**:
- Show task details: status, priority, estimated hours, last sync
- Show dependencies and blockers
- Show acceptance criteria with checkboxes
- Links to open file or GitHub issue
- Formatted with markdown

**Acceptance Criteria**:
- ✅ Tooltip appears on hover within 200ms
- ✅ Shows all 7 required fields
- ✅ Formatting is readable (proper spacing, headers)
- ✅ Links are clickable
- ✅ Loads quickly without blocking UI
- ✅ Handles missing data gracefully

**Test Strategy**:

**Unit Tests (70%)**:
```typescript
describe('TooltipProvider', () => {
  it('should generate tooltip markdown from task data', () => {
    // Behavioral: Tests output format
    const tooltip = provider.generateTooltip(taskData);
    expect(tooltip).toContain('**Status**: In Progress');
    expect(tooltip).toContain('**Priority**: High');
  });

  it('should format dependencies as clickable links', () => {
    // Behavioral: Tests link generation
    const tooltip = provider.generateTooltip({depends_on: [18, 19]});
    expect(tooltip).toContain('[#18]');
  });
});
```

**Integration Tests (25%)**:
```typescript
describe('Tooltip Integration', () => {
  it('should provide tooltip via VSCode hover provider', async () => {
    const hover = await tooltipProvider.provideHover(document, position);
    expect(hover.contents).toBeDefined();
  });
});
```

**Estimated Effort**: 6-8 hours

---

### Feature 6: Desktop Notifications

**Description**: System notifications for important events

**Requirements**:
- Notify when task auto-completes (100%)
- Notify when task gets unblocked
- Notify when sync fails
- Configurable notification types (settings)
- Click notification to open relevant task

**Acceptance Criteria**:
- ✅ Notifications appear for 4 configured event types
- ✅ Notifications are dismissible
- ✅ Click notification navigates to task
- ✅ Settings control which notifications show
- ✅ No notification spam (debounced 5 min per task)
- ✅ Notifications respect system DND mode

**Test Strategy**:

**Unit Tests (70%)**:
```typescript
describe('NotificationManager', () => {
  it('should debounce duplicate notifications', () => {
    // Behavioral: Tests business rule
    manager.notify('task-complete', 20);
    manager.notify('task-complete', 20); // Should be ignored
    expect(vscode.window.showInformationMessage).toHaveBeenCalledTimes(1);
  });

  it('should respect settings for notification types', () => {
    // Behavioral: Tests configuration logic
    settings.notifyOnComplete = false;
    manager.notify('task-complete', 20);
    expect(vscode.window.showInformationMessage).not.toHaveBeenCalled();
  });
});
```

**Integration Tests (25%)**:
```typescript
describe('Notification Integration', () => {
  it('should navigate to task when notification clicked', async () => {
    const action = await manager.notify('task-complete', 20);
    await action.onClick();
    expect(treeView.selectTask).toHaveBeenCalledWith(20);
  });
});
```

**Estimated Effort**: 4-6 hours

---

### Feature 7: Settings & Configuration

**Description**: Extension settings for customization

**Requirements**:
- Auto-refresh interval (seconds, 0 = disabled)
- Show progress percentage (boolean)
- Notify on task complete (boolean)
- Notify on unblock (boolean)
- GitHub token (optional, for higher rate limits)
- Tree view sort by: status/number/priority
- Group completed tasks (boolean)

**Acceptance Criteria**:
- ✅ All 7 settings appear in VSCode settings UI
- ✅ Settings take effect immediately (no reload)
- ✅ Default values are sensible
- ✅ Settings persist across sessions
- ✅ Validation for invalid values (e.g., negative interval)
- ✅ GitHub token encrypted in storage

**Test Strategy**:

**Unit Tests (70%)**:
```typescript
describe('Settings', () => {
  it('should validate refresh interval range', () => {
    // Behavioral: Tests validation logic
    expect(settings.validateInterval(-1)).toBe(false);
    expect(settings.validateInterval(0)).toBe(true); // 0 = disabled
    expect(settings.validateInterval(30)).toBe(true);
  });

  it('should apply settings changes immediately', () => {
    // Behavioral: Tests reactive behavior
    settings.set('autoRefreshInterval', 60);
    expect(treeView.refreshInterval).toBe(60000); // ms
  });
});
```

**Integration Tests (25%)**:
```typescript
describe('Settings Integration', () => {
  it('should persist settings to VSCode storage', async () => {
    settings.set('notifyOnComplete', false);
    const stored = await vscode.workspace.getConfiguration('ccpm').get('notifyOnComplete');
    expect(stored).toBe(false);
  });
});
```

**Estimated Effort**: 4-6 hours

---

### Feature 8: Context Menu Actions

**Description**: Right-click actions on tree items

**Requirements**:
- 7 actions: Start Task, Complete Task, View on GitHub, Copy Issue Number, Sync Progress, Refresh Status, Edit Task File
- Actions shown based on item type (epic vs task)
- Disabled actions grayed out
- Error handling with user feedback

**Acceptance Criteria**:
- ✅ All 7 actions appear in context menu
- ✅ Actions execute correctly
- ✅ Actions shown appropriately (epic vs task)
- ✅ Disabled actions are grayed out
- ✅ Errors handled gracefully with toast
- ✅ Actions complete within 2 seconds

**Test Strategy**:

**Unit Tests (70%)**:
```typescript
describe('Context Menu', () => {
  it('should show task-specific actions for tasks', () => {
    // Behavioral: Tests menu logic
    const actions = menu.getActionsFor('task', task);
    expect(actions).toContain('Start Task');
    expect(actions).not.toContain('View Epic');
  });

  it('should disable Complete action for completed tasks', () => {
    // Behavioral: Tests business rule
    task.status = 'completed';
    const action = menu.getAction('Complete Task', task);
    expect(action.enabled).toBe(false);
  });
});
```

**Integration Tests (25%)**:
```typescript
describe('Context Menu Integration', () => {
  it('should execute action via VSCode command', async () => {
    await menu.executeAction('Start Task', task);
    expect(vscode.commands.executeCommand).toHaveBeenCalledWith('ccpm.startTask', task);
  });
});
```

**Estimated Effort**: 6-8 hours

---

## Non-Functional Requirements

### Performance
- Tree view loads in < 500ms for 100 tasks
- Progress panel renders in < 200ms
- GitHub API calls cached (5 min TTL)
- No UI freezing during operations
- File watcher debounced (500ms)

### Reliability
- Handle network failures gracefully (retry 3x with exponential backoff)
- Validate file existence before operations
- Handle missing .claude directory
- Graceful degradation without GitHub API

### Usability
- Consistent with VSCode UI patterns
- Clear error messages with actionable suggestions
- Accessible via keyboard shortcuts
- Responsive to user actions (< 1s feedback)

### Security
- No secrets in extension code
- GitHub token encrypted in VSCode SecretStorage
- Validate all user inputs
- No arbitrary code execution
- Sanitize markdown rendering (XSS prevention)

### Testing
- 90-92% line coverage
- 88-90% branch coverage
- 90-95% function coverage
- Behavioral assertions (not implementation tests)
- Mock all external dependencies

## Coverage Requirements by Component

| Component | Line | Branch | Function | Critical Paths |
|-----------|------|--------|----------|----------------|
| Epic Tree Provider | 90% | 88% | 95% | 100% |
| Progress Panel | 92% | 90% | 95% | 100% |
| Status Bar Manager | 90% | 88% | 90% | 100% |
| Commands | 90% | 85% | 95% | 100% |
| Settings Manager | 88% | 85% | 90% | N/A |
| Notification Manager | 85% | 85% | 90% | 95% |
| Context Menu | 85% | 85% | 90% | N/A |
| Tooltip Provider | 90% | 88% | 95% | N/A |

**Overall Target**: 90-92% line, 88-90% branch, 90-95% function

## Out of Scope

- Task creation from extension (use `/pm:task-add`)
- Epic creation (use CLI workflow)
- PRD parsing (use CLI)
- Multi-repo/multi-workspace support
- Mobile companion app
- Web dashboard
- AI features (future enhancement)

## Timeline

### Phase 1: Core UI + Tests (3 weeks)
- Epic/Task tree view (16-20h + 12-15h tests)
- Basic commands (8-12h + 6-8h tests)
- Status bar (8-10h + 6h tests)
- **Deliverable**: Working tree view with 90% coverage

### Phase 2: Enhanced Features + Tests (2 weeks)
- Progress panel (12-16h + 10h tests)
- Hover tooltips (6-8h + 4h tests)
- Notifications (4-6h + 3h tests)
- **Deliverable**: Full feature set with 90% coverage

### Phase 3: Polish + E2E Tests (1 week)
- Settings (4-6h + 3h tests)
- Context menu (6-8h + 4h tests)
- E2E test suite (8-12h)
- Documentation (6-8h)
- **Deliverable**: Production-ready extension

**Total Estimated Time**: 120-160 hours (6 weeks)
- Implementation: 64-86 hours
- Unit/Integration Tests: 48-62 hours
- E2E Tests: 8-12 hours

## Dependencies

- VSCode API >= 1.80.0
- Node.js >= 18.x
- TypeScript >= 5.0
- CCPM system installed in workspace
- GitHub CLI configured (for label checks)
- jq installed (for JSON parsing)

## Testing Tools

- **Unit/Integration**: Mocha, Chai, Sinon
- **Coverage**: nyc (Istanbul)
- **E2E**: @vscode/test-electron
- **Mocking**: Sinon for VSCode APIs, file system, GitHub
- **CI**: GitHub Actions with coverage reporting

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| GitHub API rate limits | High | Cache responses (5 min), use user tokens, fallback to local data |
| File watching performance | Medium | Debounce (500ms), limit watched directories, use VSCode's built-in watcher |
| VSCode API changes | Low | Pin to stable API version (1.80+), test upgrades thoroughly |
| Complex state management | Medium | Use clear state patterns, comprehensive unit tests, document state flow |
| Test coverage < 90% | High | Enforce coverage gates in CI, review coverage reports, behavioral testing |

## Future Enhancements (Post-MVP)

- Gantt chart view of tasks
- Time tracking integration
- Dependency graph visualization
- AI-powered task suggestions
- Slack notifications
- Multi-workspace support
- Offline mode with sync queue
- Custom themes

## Success Criteria

Extension is successful if:
- ✅ Passes all acceptance criteria
- ✅ Achieves 90-92% test coverage
- ✅ No critical bugs in production
- ✅ 80%+ user satisfaction rating
- ✅ Reduces terminal usage by 50%
- ✅ Publishes to VSCode Marketplace
- ✅ All E2E user workflows pass

## Documentation Requirements

- README with installation, usage, and screenshots
- CHANGELOG with version history
- CONTRIBUTING guidelines
- Architecture documentation
- API documentation for extension points
- Testing guide with examples

---

**Version**: 1.0.0
**Author**: CCPM Enhanced Team
**Last Updated**: 2025-10-04
**Testing Standard**: projecttask TESTING_STANDARDS.md compliant
