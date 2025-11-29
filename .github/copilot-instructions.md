# CCPM Project Instructions for AI Assistants

**Project**: Claude Code Project Manager (CCPM)  
**Repository**: formaltask  
**Last Updated**: 2025-11-29

This document provides comprehensive context for AI assistants working on this project. Read this FIRST before responding to any user requests.

---

## Project Structure Overview

### Core Directories

```
/workspaces/formaltask/
├── .claude/                    # CCPM task management (THE PRIMARY LOCATION)
│   ├── commands/               # PM command implementations
│   ├── epics/                  # Epic directories with task files
│   │   ├── vscode-extension/   # VS Code extension epic
│   │   │   ├── 2.md           # Task files (numbered)
│   │   │   ├── 3.md
│   │   │   ├── 66.md
│   │   │   └── ...
│   │   └── {other-epics}/
│   ├── prds/                   # Product requirement documents
│   └── docs/                   # Project documentation
├── ccpm/                       # Legacy location (DO NOT USE)
├── doc/                        # Analysis and detailed docs
├── vscode-extension/           # VS Code extension source code
├── install/                    # Installation scripts
└── ...
```

### CRITICAL: Task File Location

**ALWAYS use `.claude/epics/{epic-name}/{number}.md` for task files**

- ❌ WRONG: `ccpm/epics/`
- ❌ WRONG: `.claude/epics/{epic-name}/tasks/`
- ✅ CORRECT: `.claude/epics/{epic-name}/{number}.md`

Example: `.claude/epics/vscode-extension/66.md`

---

## Task File Format

### Standard Task Template

```markdown
---
name: Brief task description (50 chars max)
status: open|in-progress|blocked|closed
created: 2025-11-29T16:56:00Z
updated: 2025-11-29T16:56:00Z
github: https://github.com/johnproblems/formaltask/issues/{number}
depends_on: [2, 3, 4]  # Array of task IDs this depends on
parallel: true|false
conflicts_with: []  # Array of task IDs that conflict
---

# Task: {Full descriptive title}

## Description
{2-3 paragraphs explaining what needs to be done and why}

## Problem Context (if applicable)
{Background on why this task exists, previous attempts, blockers}

## Acceptance Criteria
- [ ] Specific, testable criterion 1
- [ ] Specific, testable criterion 2
- [ ] All tests passing
- [ ] Documentation updated

## Technical Details
{Implementation approach, code snippets, configuration changes}

### Files to Modify
- `path/to/file1` - What changes
- `path/to/file2` - What changes

## Dependencies
- [ ] Dependency 1
- [ ] Dependency 2

## Effort Estimate
- Size: S|M|L|XL
- Hours: X hours
  - Breakdown: X hour
  - Breakdown: X hour
- Parallel: true|false

## Testing Strategy
{How to verify the implementation works}

## Definition of Done
- [ ] Code implemented
- [ ] Tests written and passing
- [ ] Documentation updated
- [ ] Code reviewed

## Notes
{Additional context, warnings, recommendations}

## Related Tasks
- Task #{number}: Description (status)

## References
- [Link to docs](url)
- [Link to related issue](url)
```

### Frontmatter Fields

**Required:**
- `name`: Short title (used in tree views)
- `status`: Current state
- `created`: ISO 8601 timestamp
- `github`: Full GitHub issue URL

**Optional:**
- `updated`: ISO 8601 timestamp (update when task changes)
- `depends_on`: Array of task IDs (dependencies)
- `parallel`: Boolean (can run in parallel)
- `conflicts_with`: Array of task IDs (file conflicts)

---

## Epic Directory Structure

Each epic has its own directory under `.claude/epics/`:

```
.claude/epics/vscode-extension/
├── 2.md          # Task: Initialize extension project
├── 3.md          # Task: Testing infrastructure
├── 4.md          # Task: CI/CD pipeline
├── 66.md         # Task: Coverage instrumentation
└── ...
```

### Task Numbering

- Tasks are numbered sequentially
- Number matches the GitHub issue number
- To find next number: `ls -1 .claude/epics/{epic}/*.md | grep -E '^[0-9]+\.md$' | sed 's/\.md$//' | sort -n | tail -1`

---

## GitHub Issue Integration

### Creating Issues

When creating a GitHub issue for a task:

1. **Create the task file first**: `.claude/epics/{epic}/{number}.md`
2. **Create the issue**: `gh issue create --title "{title}" --label "enhancement" --body "$(cat .claude/epics/{epic}/{number}.md)"`
3. **Update task frontmatter** with GitHub URL

### Updating Issues

When task file changes:
```bash
gh issue edit {number} --body "$(cat .claude/epics/{epic}/{number}.md)"
```

### Available Labels

Check available labels before using:
```bash
gh label list
```

Common labels: `enhancement`, `bug`, `documentation`, `testing`

---

## VS Code Extension Specifics

### Directory Structure

```
vscode-extension/
├── src/
│   ├── extension.ts        # Main extension entry point
│   └── test/
│       ├── suite/
│       │   ├── extension.test.ts
│       │   └── index.ts
│       ├── helpers/
│       │   └── testUtils.ts
│       └── runTest.js
├── out/                    # Compiled TypeScript
├── dist/                   # Webpack bundle
├── .vscode-test/          # VS Code test runner cache
├── package.json
├── tsconfig.json
├── webpack.config.js
└── .nycrc.json            # Coverage configuration
```

### Key Files

- **`package.json`**: Extension metadata, scripts, dependencies
- **`tsconfig.json`**: TypeScript configuration (strict mode)
- **`webpack.config.js`**: Bundling configuration
- **`.nycrc.json`**: Coverage thresholds and configuration

### Testing

- **Framework**: Mocha (BDD interface)
- **Mocking**: Sinon
- **Coverage**: nyc (Istanbul)
- **Test Runner**: @vscode/test-electron (required for VS Code extensions)

**Critical**: VS Code extensions MUST use `@vscode/test-electron`, not plain Mocha.

### Coverage Challenges

**Known Issue**: VS Code extensions have 0% coverage because code runs in Electron process, not Node.js directly.

**Current State**: Thresholds temporarily at 0%

**Solution**: Task #66 - Implement webpack instrumentation or c8 coverage

---

## CI/CD Pipeline

### GitHub Actions Workflow

**File**: `.github/workflows/ci.yml`

**Jobs**:
1. **Lint**: ESLint checks
2. **Build**: Multi-platform matrix (Linux, macOS, Windows)
3. **Test**: Multi-platform matrix (11 tests)
4. **Coverage**: nyc coverage reports
5. **Quality Gate**: Overall pass/fail

**Status**: ✅ All jobs passing

### Branches

- `main`: Production
- `enhancements`: Feature development
- `develop`: Integration

Pipeline triggers on push/PR to these branches.

---

## Common PM Commands

### Issue Management

```bash
/pm:import {issue_number}          # Import GitHub issue as task
/pm:issue-show {issue_number}      # Show task details
/pm:issue-analyze {issue_number}   # Analyze for parallel work
/pm:issue-start {issue_number}     # Start working on issue
/pm:issue-close {issue_number}     # Close completed issue
```

### Epic Management

```bash
/pm:epic-list                      # List all epics
/pm:epic-show {epic_name}          # Show epic details
/pm:epic-status {epic_name}        # Show epic progress
```

### Status Commands

```bash
/pm:status                         # Overall project status
/pm:in-progress                    # Show in-progress tasks
/pm:blocked                        # Show blocked tasks
/pm:next                          # Suggest next task
```

---

## Documentation Locations

### Analysis Documents

**Location**: `doc/`

- `vscode-extension-setup-detailed-analysis.md` - Extension setup
- `vscode-extension-testing-infra-detailed-analysis.md` - Testing
- `vscode-extension-cicd-detailed-analysis.md` - CI/CD pipeline

**Purpose**: Detailed post-implementation analysis, lessons learned, troubleshooting

### User-Facing Documentation

**Locations**:
- `.github/CI_CD.md` - CI/CD guide
- `.github/BRANCH_PROTECTION.md` - Branch protection setup
- `.github/QUICK_REFERENCE.md` - Quick reference
- `vscode-extension/README.md` - Extension README
- `vscode-extension/TESTING.md` - Testing guide

---

## Workflow: Creating a New Task

### Step 1: Determine Task Number

```bash
cd /workspaces/formaltask/.claude/epics/{epic-name}
NEXT_NUM=$(($(ls -1 *.md | grep -E '^[0-9]+\.md$' | sed 's/\.md$//' | sort -n | tail -1) + 1))
```

### Step 2: Create Task File

Create `.claude/epics/{epic-name}/${NEXT_NUM}.md` using the standard template above.

### Step 3: Create GitHub Issue

```bash
gh issue create \
  --title "Task title" \
  --label "enhancement" \
  --body "$(cat .claude/epics/{epic-name}/${NEXT_NUM}.md)"
```

### Step 4: Update Task Frontmatter

Add the GitHub URL to the task file:
```yaml
github: https://github.com/johnproblems/formaltask/issues/{number}
```

### Step 5: Commit

```bash
git add .claude/epics/{epic-name}/${NEXT_NUM}.md
git commit -m "feat: add task #{number} - {title}"
git push origin {branch}
```

---

## Workflow: Updating Analysis Documents

### When to Update

- After completing major tasks
- When encountering significant challenges
- When implementation differs from plan
- To document lessons learned

### What to Include

1. **Implementation Challenges**: What went wrong, why, how it was fixed
2. **Iterations**: Number of attempts, what changed each time
3. **Current State**: What's working, what's temporary, what's pending
4. **Lessons Learned**: Key takeaways for future work
5. **Next Steps**: Follow-up tasks, future work

### Example Structure

```markdown
## Implementation Challenges & Resolution

### Challenge 1: {Problem}
**Issue**: {Description}
**Root Cause**: {Why it happened}
**Attempted Solutions**: {What was tried}
**Final Resolution**: {What worked}
**Result**: {Outcome}

### Challenge 2: ...

### Lessons Learned
1. {Lesson}
2. {Lesson}

### Current State
✅ **Working**: {What's complete}
⚠️ **Temporary**: {What's temporary}
📋 **Next**: {What's pending}
```

---

## Common Mistakes to Avoid

### ❌ Wrong Task Location
- **Don't use**: `ccpm/epics/`
- **Don't use**: `.claude/epics/{epic}/tasks/`
- **Use**: `.claude/epics/{epic}/{number}.md`

### ❌ Wrong Test Runner
- **Don't use**: Plain Mocha for VS Code extensions
- **Use**: `@vscode/test-electron`

### ❌ Incomplete Task Format
- **Don't forget**: Frontmatter with all required fields
- **Don't forget**: GitHub URL in frontmatter
- **Don't forget**: Effort estimate and dependencies

### ❌ Creating Issues Without Task Files
- **Always create task file first**
- **Then create GitHub issue from task file**
- **Then update task file with GitHub URL**

### ❌ Assuming Context
- **Don't assume** you know the project structure
- **Read** `.claude/epics/` to see existing tasks
- **Check** GitHub issues to see what exists
- **Ask** if unclear rather than guessing

---

## Quick Reference Commands

### Find Epic Tasks
```bash
ls -1 .claude/epics/{epic-name}/*.md
```

### Next Task Number
```bash
cd .claude/epics/{epic-name}
ls -1 *.md | grep -E '^[0-9]+\.md$' | sed 's/\.md$//' | sort -n | tail -1
```

### Create GitHub Issue
```bash
gh issue create --title "{title}" --label "{label}" --body "$(cat {task-file})"
```

### Update GitHub Issue
```bash
gh issue edit {number} --body "$(cat {task-file})"
```

### Check CI Status
```bash
gh run list --branch {branch} --limit 5
gh run view {run-id}
```

### Available Labels
```bash
gh label list
```

---

## Project-Specific Context

### VS Code Extension Status

**Current State**:
- ✅ Extension skeleton created
- ✅ TypeScript + webpack configured
- ✅ Testing infrastructure working (11/11 tests passing)
- ✅ CI/CD pipeline green on all platforms
- ⚠️ Coverage at 0% (temporary, needs proper instrumentation)
- 📋 No actual functionality implemented yet

**Next Steps**:
1. Implement actual extension features (commands, views, providers)
2. Add proper coverage instrumentation (Task #66)
3. Raise coverage thresholds to 90%

### Known Issues

1. **Coverage**: VS Code extensions need special instrumentation (Task #66)
2. **Console Logging**: Removed from skeleton (was causing test failures)
3. **Test Environment**: Must use @vscode/test-electron, not plain Mocha

---

## Testing Standards

### Coverage Targets
- **Lines**: 90%
- **Statements**: 90%
- **Functions**: 90%
- **Branches**: 90%

**Current**: Temporarily at 0% pending proper instrumentation

### Test Distribution
- **70% Unit Tests**: Pure functions, data providers
- **25% Integration Tests**: VS Code API integration
- **5% E2E Tests**: Critical user workflows

---

## Emergency Contacts & Resources

### Documentation
- Main README: `/workspaces/formaltask/README.md`
- CCPM Commands: `/workspaces/formaltask/COMMANDS.md`
- Agents Guide: `/workspaces/formaltask/AGENTS.md`

### Key Files
- Task Template: This document (COPILOT_INSTRUCTIONS.md)
- PRD: `.claude/prds/vscode-extension.md`
- Analysis Docs: `doc/vscode-extension-*.md`

### GitHub
- Repository: `johnproblems/formaltask`
- Issues: Use `gh issue` commands
- Actions: `.github/workflows/ci.yml`

---

## Summary: What to Remember

1. **Task files live in** `.claude/epics/{epic}/{number}.md`
2. **Always create task file before GitHub issue**
3. **VS Code extensions need @vscode/test-electron**
4. **Coverage is currently 0% (temporary)**
5. **Update analysis docs after major work**
6. **Check existing structure before assuming**
7. **When in doubt, ASK the user**

---

**Last Updated**: 2025-11-29  
**Maintainer**: Project Owner  
**Version**: 1.0
