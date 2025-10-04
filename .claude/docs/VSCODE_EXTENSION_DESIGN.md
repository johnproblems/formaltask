# VSCode Extension Design - CCPM Monitor

## Overview

A VSCode extension that provides deep integration with the Claude Code Project Manager (CCPM) system, offering visual task management, progress monitoring, and quick access to PM commands.

## Extension Metadata

- **Name**: CCPM Monitor
- **ID**: `ccpm-monitor`
- **Publisher**: (your GitHub username)
- **Repository**: Separate repo from main project
- **Language**: TypeScript (standard for VSCode extensions)
- **VS Code Engine**: `^1.80.0` (modern features)

## Core Features

### 1. Epic/Task Tree View

**Location**: Activity Bar (left sidebar, custom icon)

**Tree Structure**:
```
📚 CCPM Epics
├── 📦 Phase A3.2 Preferences Testing [40% complete]
│   ├── 🟢 #18 Preference Manager - Unit Tests
│   ├── 🟢 #19 Preference Manager - Integration
│   ├── 🟡 #20 Typography System - Unit Tests (65%)
│   ├── 🟡 #21 Typography System - Integration (30%)
│   ├── ⏭️  #22 Window Positioning - Unit Tests [NEXT]
│   ├── 🔴 #23 Window Positioning - Multi-Monitor [BLOCKED]
│   └── ⚪ #24 Window Positioning - Persistence
├── 📦 Phase A1 Framework Testing [14% complete]
│   └── ...
└── 📦 Phase A2 Title Bar Testing [0% complete]
    └── ...
```

**Tree Item Features**:
- **Click task** → Opens task file (`.claude/epics/<epic>/<task>.md`)
- **Right-click menu**:
  - Start Task (`/pm:issue-start <number>`)
  - Complete Task (`/pm:issue-complete <number>`)
  - View on GitHub (opens browser)
  - Copy Issue Number
  - Refresh Status
- **Inline icons**:
  - 🟢 = Completed
  - 🟡 = In Progress
  - 🔴 = Blocked
  - ⏭️ = Pending (next)
  - ⚪ = Pending
- **Progress bar** for epics (inline progress indicator)

### 2. Progress Notes Panel

**Location**: Panel area (bottom, tabs alongside Terminal/Problems/Output)

**Name**: "CCPM Progress"

**Content**:
- Displays `.claude/epics/*/updates/<issue>/progress.md` for selected task
- Auto-refreshes when file changes
- Markdown rendering with syntax highlighting
- Collapsible sections
- **AI Summarize Button**: Calls Claude to summarize progress notes

**Features**:
- **Auto-select**: When you click a task in tree view, progress panel shows that task's progress
- **Edit button**: Opens progress.md in editor
- **Sync button**: Runs `/pm:issue-sync <issue>` for current task
- **Time indicators**: Shows "Last synced: 5m ago" at top

### 3. Status Bar Integration

**Location**: Bottom status bar (right side)

**Display**:
```
$(pulse) CCPM: Task #20 (65%) | Epic: 40%
```

**Behavior**:
- Shows currently selected/active task
- Click to open Quick Pick with:
  - View Task Details
  - Sync Progress
  - Complete Task
  - Switch to Different Task
- Pulsing icon when task is in progress
- Green checkmark when task completed

### 4. Quick Pick Commands

**Command Palette** (Cmd/Ctrl+Shift+P):
- `CCPM: Show Epic Status` → Runs `/pm:epic-status` in terminal
- `CCPM: Add Task to Epic` → Interactive prompts for `/pm:task-add`
- `CCPM: Start Next Task` → Finds and starts next pending task
- `CCPM: Complete Current Task` → Completes task you're working on
- `CCPM: Sync Progress` → Syncs current task progress to GitHub
- `CCPM: Refresh All` → Refreshes tree view from GitHub
- `CCPM: View on GitHub` → Opens current epic/task on GitHub

### 5. Hover Tooltips

**When hovering over task in tree view**:
```
Task #20: Typography System - Unit Tests
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Status: In Progress (65%)
Priority: High
Estimated: 8 hours
Last sync: 5 minutes ago

Dependencies: #18, #19 (completed)
Blocks: #23

Acceptance Criteria:
✅ Test font family validation
✅ Test size constraints
🔄 Test line height calculations
□ Test letter spacing
□ Test performance with 100+ fonts
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Click to open task file
Right-click for more actions
```

### 6. Notifications

**Desktop notifications** for key events:
- "Task #20 reached 100% - Auto-completing..." (when auto-complete triggers)
- "Task #20 completed ✓" (when issue-complete succeeds)
- "Task #23 unblocked" (when dependencies complete)
- "Sync failed - Check internet connection" (error notifications)

**Toast notifications** (in VSCode):
- "Pending label moved to task #22"
- "Progress synced to GitHub"

### 7. Settings/Configuration

**VSCode Settings** (`settings.json`):
```json
{
  "ccpm.autoRefreshInterval": 30,  // seconds (0 = disabled)
  "ccpm.showProgressPercentage": true,
  "ccpm.notifyOnTaskComplete": true,
  "ccpm.notifyOnUnblock": true,
  "ccpm.githubToken": "",  // Optional: for higher rate limits
  "ccpm.epicStatusCommand": "/pm:epic-status",
  "ccpm.treeView.sortBy": "status",  // or "number", "priority"
  "ccpm.treeView.groupCompleted": true,  // collapse completed tasks
  "ccpm.progressPanel.aiSummarizePrompt": "Summarize this development progress in 3-5 bullet points"
}
```

## Technical Architecture

### File Structure

```
ccpm-monitor/
├── package.json              # Extension manifest
├── tsconfig.json            # TypeScript config
├── .vscodeignore           # Files to exclude from package
├── README.md               # Extension documentation
├── CHANGELOG.md            # Version history
├── src/
│   ├── extension.ts         # Main entry point
│   ├── epicTreeProvider.ts  # Tree view data provider
│   ├── progressPanel.ts     # Webview panel for progress notes
│   ├── statusBar.ts         # Status bar item manager
│   ├── githubSync.ts        # GitHub API integration
│   ├── commands.ts          # Command implementations
│   ├── models/
│   │   ├── Epic.ts         # Epic data model
│   │   ├── Task.ts         # Task data model
│   │   └── ProgressData.ts # Progress tracking model
│   ├── utils/
│   │   ├── fileWatcher.ts  # File system watching
│   │   ├── markdown.ts     # Markdown parsing/rendering
│   │   ├── dateUtils.ts    # Time formatting
│   │   └── githubUtils.ts  # GitHub helper functions
│   └── test/
│       ├── suite/
│       │   ├── extension.test.ts
│       │   └── epicTree.test.ts
│       └── runTest.ts
├── media/
│   ├── icons/
│   │   ├── epic.svg        # Epic icon
│   │   ├── task.svg        # Task icon
│   │   └── ccpm.svg        # Extension icon
│   └── styles/
│       └── progress.css    # Progress panel styles
└── resources/
    └── templates/
        └── progress.html   # Webview HTML template
```

### Key Classes/Modules

#### 1. `epicTreeProvider.ts` - Tree View Data Provider

```typescript
import * as vscode from 'vscode';

interface EpicTreeItem {
  type: 'epic' | 'task';
  id: string;
  label: string;
  status: 'completed' | 'in-progress' | 'blocked' | 'pending';
  progress?: number;
  issueNumber?: number;
  githubUrl?: string;
}

class EpicTreeProvider implements vscode.TreeDataProvider<EpicTreeItem> {
  private _onDidChangeTreeData = new vscode.EventEmitter<EpicTreeItem | undefined>();
  readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

  constructor(private workspaceRoot: string) {}

  refresh(): void {
    this._onDidChangeTreeData.fire(undefined);
  }

  getTreeItem(element: EpicTreeItem): vscode.TreeItem {
    const treeItem = new vscode.TreeItem(
      element.label,
      element.type === 'epic'
        ? vscode.TreeItemCollapsibleState.Expanded
        : vscode.TreeItemCollapsibleState.None
    );

    // Set icon based on status
    treeItem.iconPath = this.getIconForStatus(element.status);

    // Set context for right-click menu
    treeItem.contextValue = element.type;

    // Add command to open file
    if (element.type === 'task') {
      treeItem.command = {
        command: 'ccpm.openTaskFile',
        title: 'Open Task',
        arguments: [element]
      };
    }

    return treeItem;
  }

  async getChildren(element?: EpicTreeItem): Promise<EpicTreeItem[]> {
    if (!element) {
      // Root level: return epics
      return this.getEpics();
    } else {
      // Child level: return tasks for epic
      return this.getTasksForEpic(element.id);
    }
  }

  private async getEpics(): Promise<EpicTreeItem[]> {
    // Read .claude/epics directory
    // Parse epic.md files
    // Return epic items
  }

  private async getTasksForEpic(epicId: string): Promise<EpicTreeItem[]> {
    // Read task files from .claude/epics/<epicId>/
    // Query GitHub for labels/status
    // Return task items
  }

  private getIconForStatus(status: string): vscode.ThemeIcon {
    switch(status) {
      case 'completed': return new vscode.ThemeIcon('check', new vscode.ThemeColor('testing.iconPassed'));
      case 'in-progress': return new vscode.ThemeIcon('sync~spin', new vscode.ThemeColor('testing.iconQueued'));
      case 'blocked': return new vscode.ThemeIcon('error', new vscode.ThemeColor('testing.iconFailed'));
      case 'pending': return new vscode.ThemeIcon('circle-outline');
      default: return new vscode.ThemeIcon('circle-outline');
    }
  }
}
```

#### 2. `progressPanel.ts` - Progress Notes Webview

```typescript
import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import * as marked from 'marked';

class ProgressPanel {
  private static currentPanel: ProgressPanel | undefined;
  private readonly _panel: vscode.WebviewPanel;
  private _currentTaskIssue: number | undefined;

  public static createOrShow(extensionUri: vscode.Uri, taskIssue: number) {
    if (ProgressPanel.currentPanel) {
      ProgressPanel.currentPanel._panel.reveal();
      ProgressPanel.currentPanel.update(taskIssue);
    } else {
      const panel = vscode.window.createWebviewPanel(
        'ccpmProgress',
        'CCPM Progress',
        vscode.ViewColumn.Two,
        {
          enableScripts: true,
          localResourceRoots: [vscode.Uri.joinPath(extensionUri, 'media')]
        }
      );

      ProgressPanel.currentPanel = new ProgressPanel(panel, extensionUri);
      ProgressPanel.currentPanel.update(taskIssue);
    }
  }

  private constructor(panel: vscode.WebviewPanel, extensionUri: vscode.Uri) {
    this._panel = panel;
    this._panel.onDidDispose(() => this.dispose());

    // Handle messages from webview
    this._panel.webview.onDidReceiveMessage(message => {
      switch (message.command) {
        case 'sync':
          this.syncProgress();
          break;
        case 'summarize':
          this.summarizeProgress();
          break;
      }
    });
  }

  public update(taskIssue: number) {
    this._currentTaskIssue = taskIssue;

    // Find progress.md file
    const progressFile = this.findProgressFile(taskIssue);
    if (progressFile) {
      const content = fs.readFileSync(progressFile, 'utf8');
      const html = this.renderProgressHTML(content);
      this._panel.webview.html = html;
    } else {
      this._panel.webview.html = this.getNoProgressHTML();
    }
  }

  private findProgressFile(taskIssue: number): string | undefined {
    // Search .claude/epics/*/updates/<taskIssue>/progress.md
  }

  private renderProgressHTML(markdown: string): string {
    const html = marked.parse(markdown);
    return `<!DOCTYPE html>
    <html>
      <head>
        <link rel="stylesheet" href="styles/progress.css">
      </head>
      <body>
        <div class="toolbar">
          <button onclick="sync()">🔄 Sync to GitHub</button>
          <button onclick="summarize()">🤖 AI Summarize</button>
          <span class="last-sync">Last synced: ${this.getLastSyncTime()}</span>
        </div>
        <div class="content">
          ${html}
        </div>
        <script>
          const vscode = acquireVsCodeApi();
          function sync() {
            vscode.postMessage({ command: 'sync' });
          }
          function summarize() {
            vscode.postMessage({ command: 'summarize' });
          }
        </script>
      </body>
    </html>`;
  }

  private async syncProgress() {
    // Run /pm:issue-sync command
    const terminal = vscode.window.createTerminal('CCPM');
    terminal.sendText(`/pm:issue-sync ${this._currentTaskIssue}`);
    terminal.show();
  }

  private async summarizeProgress() {
    // Call Claude API to summarize progress notes
    // Or use built-in AI features if available
    vscode.window.showInformationMessage('AI summarization coming soon!');
  }

  public dispose() {
    ProgressPanel.currentPanel = undefined;
    this._panel.dispose();
  }
}
```

#### 3. `statusBar.ts` - Status Bar Manager

```typescript
import * as vscode from 'vscode';

class StatusBarManager {
  private statusBarItem: vscode.StatusBarItem;
  private currentTask: { issue: number; progress: number } | undefined;

  constructor() {
    this.statusBarItem = vscode.window.createStatusBarItem(
      vscode.StatusBarAlignment.Right,
      100
    );
    this.statusBarItem.command = 'ccpm.showQuickPick';
    this.statusBarItem.show();
  }

  updateTask(issue: number, progress: number, epicProgress: number) {
    this.currentTask = { issue, progress };
    this.statusBarItem.text = `$(pulse) CCPM: Task #${issue} (${progress}%) | Epic: ${epicProgress}%`;
    this.statusBarItem.tooltip = `Click for actions on task #${issue}`;
  }

  clearTask() {
    this.currentTask = undefined;
    this.statusBarItem.text = `$(circle-outline) CCPM: No active task`;
    this.statusBarItem.tooltip = 'Click to select a task';
  }

  dispose() {
    this.statusBarItem.dispose();
  }
}
```

### Commands Registration

```typescript
// extension.ts
export function activate(context: vscode.ExtensionContext) {
  const workspaceRoot = vscode.workspace.workspaceFolders?.[0].uri.fsPath;
  if (!workspaceRoot) {
    return;
  }

  // Create providers
  const epicTreeProvider = new EpicTreeProvider(workspaceRoot);
  const statusBarManager = new StatusBarManager();

  // Register tree view
  vscode.window.registerTreeDataProvider('ccpmEpics', epicTreeProvider);

  // Register commands
  context.subscriptions.push(
    vscode.commands.registerCommand('ccpm.refreshEpics', () => epicTreeProvider.refresh()),
    vscode.commands.registerCommand('ccpm.openTaskFile', (task) => openTaskFile(task)),
    vscode.commands.registerCommand('ccpm.startTask', (task) => startTask(task)),
    vscode.commands.registerCommand('ccpm.completeTask', (task) => completeTask(task)),
    vscode.commands.registerCommand('ccpm.syncProgress', () => syncCurrentProgress()),
    vscode.commands.registerCommand('ccpm.viewOnGitHub', (task) => openGitHub(task)),
    vscode.commands.registerCommand('ccpm.showEpicStatus', () => showEpicStatus()),
    vscode.commands.registerCommand('ccpm.addTask', () => addTaskInteractive())
  );

  // Auto-refresh on file changes
  const fileWatcher = vscode.workspace.createFileSystemWatcher(
    '**/.claude/epics/**/*.md'
  );
  fileWatcher.onDidChange(() => epicTreeProvider.refresh());
  context.subscriptions.push(fileWatcher);

  // Auto-refresh from GitHub (configurable interval)
  const config = vscode.workspace.getConfiguration('ccpm');
  const refreshInterval = config.get<number>('autoRefreshInterval', 30);
  if (refreshInterval > 0) {
    setInterval(() => epicTreeProvider.refresh(), refreshInterval * 1000);
  }
}
```

## Package.json Configuration

```json
{
  "name": "ccpm-monitor",
  "displayName": "CCPM Monitor",
  "description": "Visual task management for Claude Code Project Manager",
  "version": "0.1.0",
  "engines": {
    "vscode": "^1.80.0"
  },
  "categories": ["Other"],
  "activationEvents": [
    "workspaceContains:.claude/epics"
  ],
  "main": "./out/extension.js",
  "contributes": {
    "viewsContainers": {
      "activitybar": [{
        "id": "ccpm",
        "title": "CCPM",
        "icon": "media/icons/ccpm.svg"
      }]
    },
    "views": {
      "ccpm": [{
        "id": "ccpmEpics",
        "name": "Epics & Tasks"
      }]
    },
    "commands": [
      {
        "command": "ccpm.refreshEpics",
        "title": "CCPM: Refresh Epics",
        "icon": "$(refresh)"
      },
      {
        "command": "ccpm.showEpicStatus",
        "title": "CCPM: Show Epic Status"
      },
      {
        "command": "ccpm.addTask",
        "title": "CCPM: Add Task to Epic"
      },
      {
        "command": "ccpm.startTask",
        "title": "CCPM: Start Task"
      },
      {
        "command": "ccpm.completeTask",
        "title": "CCPM: Complete Task"
      },
      {
        "command": "ccpm.syncProgress",
        "title": "CCPM: Sync Progress"
      }
    ],
    "menus": {
      "view/title": [{
        "command": "ccpm.refreshEpics",
        "when": "view == ccpmEpics",
        "group": "navigation"
      }],
      "view/item/context": [
        {
          "command": "ccpm.startTask",
          "when": "view == ccpmEpics && viewItem == task",
          "group": "1_actions@1"
        },
        {
          "command": "ccpm.completeTask",
          "when": "view == ccpmEpics && viewItem == task",
          "group": "1_actions@2"
        },
        {
          "command": "ccpm.viewOnGitHub",
          "when": "view == ccpmEpics",
          "group": "2_view@1"
        }
      ]
    },
    "configuration": {
      "title": "CCPM Monitor",
      "properties": {
        "ccpm.autoRefreshInterval": {
          "type": "number",
          "default": 30,
          "description": "Auto-refresh interval in seconds (0 to disable)"
        },
        "ccpm.showProgressPercentage": {
          "type": "boolean",
          "default": true,
          "description": "Show progress percentage in tree view"
        },
        "ccpm.notifyOnTaskComplete": {
          "type": "boolean",
          "default": true,
          "description": "Show notification when task completes"
        }
      }
    }
  },
  "scripts": {
    "vscode:prepublish": "npm run compile",
    "compile": "tsc -p ./",
    "watch": "tsc -watch -p ./",
    "pretest": "npm run compile",
    "test": "node ./out/test/runTest.js"
  },
  "devDependencies": {
    "@types/vscode": "^1.80.0",
    "@types/node": "^18.x",
    "typescript": "^5.0.0",
    "@vscode/test-electron": "^2.3.0"
  },
  "dependencies": {
    "marked": "^9.0.0"
  }
}
```

## Development Workflow

### Setup

```bash
# Clone extension repo
git clone https://github.com/<username>/ccpm-monitor.git
cd ccpm-monitor

# Install dependencies
npm install

# Open in VSCode
code .
```

### Testing

```bash
# Compile TypeScript
npm run compile

# Run tests
npm test

# Or press F5 in VSCode to launch Extension Development Host
```

### Publishing

```bash
# Package extension
vsce package

# Publish to VS Code Marketplace (requires account)
vsce publish

# Or install locally
code --install-extension ccpm-monitor-0.1.0.vsix
```

## Installation for Users

### Method 1: VS Code Marketplace (after publishing)
1. Open VSCode
2. Go to Extensions (Cmd/Ctrl+Shift+X)
3. Search "CCPM Monitor"
4. Click Install

### Method 2: Manual Installation
1. Download `.vsix` file from releases
2. Run: `code --install-extension ccpm-monitor-0.1.0.vsix`
3. Reload VSCode

### Method 3: Development Install
1. Clone repo
2. `npm install && npm run compile`
3. Press F5 to launch Extension Development Host

## Future Enhancements

1. **AI Integration**: Built-in Claude API calls for progress summarization
2. **Time Tracking**: Automatic time tracking per task
3. **Gantt Chart View**: Visual timeline of epic progress
4. **Dependency Graph**: Interactive visualization of task dependencies
5. **Multi-Repo Support**: Manage tasks across multiple projects
6. **Custom Themes**: Color-code epics and tasks
7. **Export Reports**: Generate PDF/HTML progress reports
8. **Slack Integration**: Post updates to Slack channels
9. **Mobile Companion**: Mobile app for checking status on the go

## Benefits

1. **No Terminal Required**: All actions available via UI
2. **Visual Feedback**: See status at a glance with colors and icons
3. **Integrated Workflow**: Work on code and manage tasks in same window
4. **Real-Time Updates**: Auto-refresh from GitHub
5. **Keyboard Shortcuts**: Fast navigation with keybindings
6. **Native Experience**: Feels like built-in VSCode feature
