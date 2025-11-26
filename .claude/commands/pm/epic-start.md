---
allowed-tools: Bash, Read, Write, LS, Task
---

# Epic Start

Launch parallel agents to work on epic tasks in a shared branch.

## Usage
```
/pm:epic-start <epic_name>
```

## Quick Check

1. **Verify epic exists:**
   ```bash
   test -f .claude/epics/$ARGUMENTS/epic.md || echo "❌ Epic not found. Run: /pm:prd-parse $ARGUMENTS"
   ```

2. **Check GitHub sync:**
   Look for `github:` field in epic frontmatter.
   If missing: "❌ Epic not synced. Run: /pm:epic-sync $ARGUMENTS first"

3. **Check for branch:**
   ```bash
   git branch -a | grep "epic/$ARGUMENTS"
   ```

4. **Check for uncommitted changes:**
   ```bash
   git status --porcelain
   ```
   If output is not empty: "❌ You have uncommitted changes. Please commit or stash them before starting an epic"

## Instructions

### 1. Create or Enter Branch

Follow `/rules/branch-operations.md`:

```bash
# Check for uncommitted changes
if [ -n "$(git status --porcelain)" ]; then
  echo "❌ You have uncommitted changes. Please commit or stash them before starting an epic."
  exit 1
fi

# If branch doesn't exist, create it
if ! git branch -a | grep -q "epic/$ARGUMENTS"; then
  git checkout main
  git pull origin main
  git checkout -b epic/$ARGUMENTS
  git push -u origin epic/$ARGUMENTS
  echo "✅ Created branch: epic/$ARGUMENTS"
else
  git checkout epic/$ARGUMENTS
  git pull origin epic/$ARGUMENTS
  echo "✅ Using existing branch: epic/$ARGUMENTS"
fi
```

### 2. Identify Ready Issues

Read all task files in `.claude/epics/$ARGUMENTS/`:
- Parse frontmatter for `status`, `depends_on`, `parallel` fields
- Check GitHub issue status if needed
- Build dependency graph

Categorize issues:
- **Ready**: No unmet dependencies, not started
- **Blocked**: Has unmet dependencies
- **In Progress**: Already being worked on
- **Complete**: Finished

### 3. Analyze Ready Issues

For each ready issue without analysis:
```bash
# Check for analysis
if ! test -f .claude/epics/$ARGUMENTS/{issue}-analysis.md; then
  echo "Analyzing issue #{issue}..."
  # Run analysis (inline or via Task tool)
fi
```

### 3.5. Commit Analysis Files (CRITICAL STEP)

**IMPORTANT:** Analysis files MUST be committed BEFORE launching agents.

```bash
# Check for new analysis files
if [ -n "$(git status --porcelain | grep '?? .*-analysis\.md')" ]; then
  echo "Committing analysis files..."

  for issue in $(git status --porcelain | grep '?? .*-analysis\.md' | awk '{print $2}' | grep -oE '[0-9]+-analysis'); do
    issue_num=$(echo "$issue" | grep -oE '^[0-9]+')

    git add ".claude/epics/$ARGUMENTS/$issue.md"
    git commit -m "Issue #$issue_num: Add analysis and execution tracking files

- Add work stream analysis for Issue #$issue_num
- Lists all parallel streams and their scope
- Provides implementation strategy and coordination points

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"

    echo "✅ Committed: Issue #$issue_num analysis"
  done
fi
```

**Why this matters:**
- Creates clear audit trail of planning BEFORE implementation
- Prevents analysis files from being left untracked
- Ensures git history shows analysis → implementation → execution
- Matches the pattern established in Issue #3

### 4. Launch Parallel Agents

For each ready issue with analysis:

```markdown
## Starting Issue #{issue}: {title}

Reading analysis...
Found {count} parallel streams:
  - Stream A: {description} (Agent-{id})
  - Stream B: {description} (Agent-{id})

Launching agents in branch: epic/$ARGUMENTS
```

Use Task tool to launch each stream:
```yaml
Task:
  description: "Issue #{issue} Stream {X}"
  subagent_type: "{agent_type}"
  prompt: |
    Working in branch: epic/$ARGUMENTS
    Issue: #{issue} - {title}
    Stream: {stream_name}

    Your scope:
    - Files: {file_patterns}
    - Work: {stream_description}

    Read full requirements from:
    - .claude/epics/$ARGUMENTS/{task_file}
    - .claude/epics/$ARGUMENTS/{issue}-analysis.md

    Follow coordination rules in /rules/agent-coordination.md

    Commit frequently with message format:
    "Issue #{issue}: {specific change}"

    Update progress in:
    .claude/epics/$ARGUMENTS/updates/{issue}/stream-{X}.md

    **IMPORTANT - GitHub Progress Comments:**
    When this stream is complete, add a GitHub issue comment with:
    - Stream number and description
    - Summary of work accomplished
    - Files created/modified
    - Testing status
    - Acceptance criteria met

    Command:
    gh issue comment {issue_number} -b "..."

    See section 7 of /pm:epic-start for the exact format.
```

### 5. Track Active Agents

Create/update `.claude/epics/$ARGUMENTS/execution-status.md`:

```markdown
---
started: {datetime}
branch: epic/$ARGUMENTS
---

# Execution Status

## Active Agents
- Agent-1: Issue #1234 Stream A (Database) - Started {time}
- Agent-2: Issue #1234 Stream B (API) - Started {time}
- Agent-3: Issue #1235 Stream A (UI) - Started {time}

## Queued Issues
- Issue #1236 - Waiting for #1234
- Issue #1237 - Waiting for #1235

## Completed
- {None yet}
```

### 5.5. Commit Execution Status File

After creating/updating execution-status.md, commit it:

```bash
git add .claude/epics/$ARGUMENTS/execution-status.md
git commit -m "Track: Start execution for $ARGUMENTS epic

- Launching agents for ready issues
- Tracking all active streams
- Monitoring dependencies and blockers

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

### 6. Monitor and Coordinate

Set up monitoring:
```bash
echo "
Agents launched successfully!

Monitor progress:
  /pm:epic-status $ARGUMENTS

View branch changes:
  git status

Stop all agents:
  /pm:epic-stop $ARGUMENTS

Merge when complete:
  /pm:epic-merge $ARGUMENTS
"
```

### 7. GitHub Issue Progress Comments

As agents complete each stream, they must add progress update comments to the GitHub issue:

**Comment Format (Post on each GitHub issue for each stream):**
```markdown
### Progress Update {N}: Stream {X} - {Description}

**Time:** {timestamp}
**Status:** ✅ Completed

**Summary:** {Brief description of what was accomplished}

**Files Created:**
- `path/to/file1.ts` - Description
- `path/to/file2.ts` - Description

**Key Features:**
- Feature A implemented
- Feature B implemented

**Testing Status:**
✅ All tests passing

**Acceptance Criteria Met:**
- [x] Criterion 1
- [x] Criterion 2
```

**Why this matters:**
- Provides real-time project visibility on GitHub
- Reviewers can track progress without checking git
- Clear documentation of what each stream accomplished
- Integration point with Issue tracking workflow
- Each stream gets its own comment (not merged into one)

**Implementation in agents:**
```bash
# After completing a stream, agents should:
gh issue comment {issue_number} -b "$(cat <<'EOF'
### Progress Update {N}: Stream {X} - {Description}
...details...
EOF
)"
```

### 8. Handle Dependencies

As agents complete streams:
- Check if any blocked issues are now ready
- Launch new agents for newly-ready work
- Update execution-status.md
- Ensure GitHub issue comments are added for each stream

## Output Format

```
🚀 Epic Execution Started: $ARGUMENTS

Branch: epic/$ARGUMENTS

Launching {total} agents across {issue_count} issues:

Issue #1234: Database Schema
  ├─ Stream A: Schema creation (Agent-1) ✓ Started
  └─ Stream B: Migrations (Agent-2) ✓ Started

Issue #1235: API Endpoints
  ├─ Stream A: User endpoints (Agent-3) ✓ Started
  ├─ Stream B: Post endpoints (Agent-4) ✓ Started
  └─ Stream C: Tests (Agent-5) ⏸ Waiting for A & B

Blocked Issues (2):
  - #1236: UI Components (depends on #1234)
  - #1237: Integration (depends on #1235, #1236)

Monitor with: /pm:epic-status $ARGUMENTS
```

## Error Handling

If agent launch fails:
```
❌ Failed to start Agent-{id}
  Issue: #{issue}
  Stream: {stream}
  Error: {reason}

Continue with other agents? (yes/no)
```

If uncommitted changes are found:
```
❌ You have uncommitted changes. Please commit or stash them before starting an epic.

To commit changes:
  git add .
  git commit -m "Your commit message"

To stash changes:
  git stash push -m "Work in progress"
  # (Later restore with: git stash pop)
```

If branch creation fails:
```
❌ Cannot create branch
  {git error message}

Try: git branch -d epic/$ARGUMENTS
Or: Check existing branches with: git branch -a
```

## Important Notes

- Follow `/rules/branch-operations.md` for git operations
- Follow `/rules/agent-coordination.md` for parallel work
- Agents work in the SAME branch (not separate branches)
- Maximum parallel agents should be reasonable (e.g., 5-10)
- Monitor system resources if launching many agents
