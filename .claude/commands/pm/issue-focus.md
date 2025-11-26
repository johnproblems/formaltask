---
allowed-tools: Bash, Read, Write, LS, Task
---

# Issue Focus

Focus on a single issue within an epic without launching other issues in parallel.

## Usage
```
/pm:issue-focus <epic_name> <issue_number>
```

Examples:
```
/pm:issue-focus prayer-web-app 6
/pm:issue-focus my-project 42
```

## Quick Check

1. **Verify epic exists:**
   ```bash
   test -f .claude/epics/$EPIC/epic.md || echo "❌ Epic not found"
   ```

2. **Verify issue exists:**
   ```bash
   test -f .claude/epics/$EPIC/$ISSUE_NUM.md || echo "❌ Issue #$ISSUE_NUM not found"
   ```

3. **Check branch:**
   ```bash
   git branch -a | grep "epic/$EPIC" || echo "❌ No epic branch. Run: /pm:epic-start $EPIC"
   ```

4. **Check for uncommitted changes:**
   ```bash
   if [ -n "$(git status --porcelain)" ]; then
     echo "❌ You have uncommitted changes. Commit or stash before starting."
     exit 1
   fi
   ```

## Instructions

### 1. Switch to Epic Branch

```bash
# Ensure we're on the epic branch
if ! git branch --show-current | grep -q "epic/$EPIC"; then
  git checkout epic/$EPIC || {
    echo "❌ Cannot switch to epic branch"
    exit 1
  }
fi

echo "✅ On branch: epic/$EPIC"
```

### 2. Check Issue Status

Read `.claude/epics/$EPIC/$ISSUE_NUM.md`:
- Parse `status` field
- Parse `depends_on` field
- Check if dependencies are complete
- Show current issue status

```bash
# Extract status from frontmatter
status=$(grep "^status:" .claude/epics/$EPIC/$ISSUE_NUM.md | cut -d' ' -f2)
depends_on=$(grep "^depends_on:" .claude/epics/$EPIC/$ISSUE_NUM.md | cut -d' ' -f2-)

if [ "$status" = "complete" ]; then
  echo "⚠️  Issue #$ISSUE_NUM is already complete"
  exit 1
fi

if [ -n "$depends_on" ] && [ "$depends_on" != "[]" ]; then
  echo "⚠️  Issue #$ISSUE_NUM depends on: $depends_on"
  echo "   Make sure dependencies are complete before proceeding"
fi
```

### 3. Create Analysis File (if needed)

Check if analysis exists:

```bash
if [ ! -f ".claude/epics/$EPIC/$ISSUE_NUM-analysis.md" ]; then
  echo "Creating analysis for Issue #$ISSUE_NUM..."

  # Use Task tool to create analysis
  # Task should output the analysis file
fi
```

### 4. Commit Analysis File (CRITICAL)

```bash
# Check for new analysis file
if [ -f ".claude/epics/$EPIC/$ISSUE_NUM-analysis.md" ]; then
  if git status --porcelain | grep -q "$ISSUE_NUM-analysis.md"; then
    echo "Committing analysis file..."

    git add ".claude/epics/$EPIC/$ISSUE_NUM-analysis.md"
    git commit -m "Issue #$ISSUE_NUM: Add analysis and execution tracking files

- Add work stream analysis for Issue #$ISSUE_NUM
- Lists all parallel streams and their scope
- Provides implementation strategy and coordination points

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"

    echo "✅ Committed analysis for Issue #$ISSUE_NUM"
  fi
fi
```

### 5. Read and Display Analysis

Display the analysis file to show what will be worked on:

```bash
echo "═══════════════════════════════════════════════════════════"
echo "Issue #$ISSUE_NUM Analysis"
echo "═══════════════════════════════════════════════════════════"
cat ".claude/epics/$EPIC/$ISSUE_NUM-analysis.md"
echo "═══════════════════════════════════════════════════════════"
```

### 6. Create Progress Tracking Structure

```bash
# Create tracking directories
mkdir -p ".claude/epics/$EPIC/updates/$ISSUE_NUM"

echo "✅ Created tracking structure"
echo "   .claude/epics/$EPIC/updates/$ISSUE_NUM/"
```

### 7. Launch Agents for This Issue Only

For each stream in the analysis file:

```yaml
Task:
  description: "Issue #$ISSUE_NUM Stream {X}"
  subagent_type: "{agent_type}"
  prompt: |
    You are working on Issue #$ISSUE_NUM in the epic: $EPIC

    Working in branch: epic/$EPIC

    Stream: {stream_name}

    Your scope:
    - Files: {file_patterns}
    - Work: {stream_description}

    Requirements:
    1. Read full task from: .claude/epics/$EPIC/$ISSUE_NUM.md
    2. Read analysis from: .claude/epics/$EPIC/$ISSUE_NUM-analysis.md
    3. Follow coordination rules in /rules/agent-coordination.md
    4. Work ONLY in assigned files

    Commits:
    - Format: "Issue #$ISSUE_NUM: {specific change}"
    - Frequent, logical commits
    - Include stream number in commit

    Progress:
    - Update: .claude/epics/$EPIC/updates/$ISSUE_NUM/stream-{X}.md
    - When complete, add GitHub issue comment with:
      * Stream number and description
      * Summary of accomplishments
      * Files created/modified
      * Testing status
      * Acceptance criteria met
    - See section 7 of /pm:epic-start for format

    Important:
    - Do NOT work on other issues
    - This issue has your full focus
    - Coordinate with other active streams in THIS issue only
    - If blocked, update progress file with details
```

### 8. Track Active Work

Create/update `.claude/epics/$EPIC/execution-status.md` with:

```markdown
---
updated: {current_datetime}
branch: epic/$EPIC
focus_issue: $ISSUE_NUM
---

# Execution Status

## Currently Focused
Issue #$ISSUE_NUM: {title}

### Active Streams
- Agent-1: Stream A ({name}) - Started {time}
- Agent-2: Stream B ({name}) - Started {time}

### Stream Dependencies
- Stream A: {depends on what}
- Stream B: {depends on what}

## Other Issues
- Status: Waiting for Issue #$ISSUE_NUM
```

### 9. Monitor Execution

```bash
echo "
✅ Issue #$ISSUE_NUM focused execution started

Epic: $EPIC
Branch: epic/$EPIC

Streams Launched: {count}

Monitor progress:
  /pm:epic-status $EPIC --issue $ISSUE_NUM

View issue on GitHub:
  gh issue view $ISSUE_NUM --web

When complete:
  /pm:issue-complete $EPIC $ISSUE_NUM

View all issues:
  /pm:issue-list $EPIC
"
```

## Key Differences from /pm:epic-start

| Aspect | epic-start | issue-focus |
|--------|-----------|-------------|
| **Scope** | All ready issues in parallel | One issue only |
| **Agent Launch** | Multiple issues simultaneously | Single issue focus |
| **When to Use** | Starting fresh epic | Working on specific issue |
| **Dependencies** | Launches all ready | Waits for explicit instruction |
| **GitHub Comments** | From each stream | From each stream |
| **Commits** | Per-stream commits | Per-stream commits |

## When to Use Each

**Use `/pm:epic-start`:**
- Launching an entire epic
- Kicking off all ready work at once
- Maximum parallelization
- When dependencies allow

**Use `/pm:issue-focus`:**
- Working on one issue at a time sequentially
- Avoiding complexity of parallel work
- Clear, linear progress
- Easier to manage and debug
- Better for learning/training
- When you want full focus on one goal

## Output Format

```
🎯 Issue #$ISSUE_NUM Focus Mode

Epic: $EPIC
Branch: epic/$EPIC
Status: Launching streams for this issue only

Issue Title: {title}

Streams (from analysis):
  ✓ Stream A: {name} (Agent-1) - Starting
  ✓ Stream B: {name} (Agent-2) - Starting
  ⏸ Stream C: {name} - Waiting (depends on A)

Other Issues: Blocked until this completes
  - Issue #X - Depends on #$ISSUE_NUM

Progress Tracking:
  .claude/epics/$EPIC/updates/$ISSUE_NUM/

Monitor with:
  /pm:epic-status $EPIC
  gh issue view $ISSUE_NUM --web
```

## Common Workflow

**Sequential Focus Mode:**
```bash
# Issue 1
/pm:issue-focus prayer-web-app 6
# Wait for completion
/pm:issue-complete prayer-web-app 6

# Issue 2 (now ready)
/pm:issue-focus prayer-web-app 7
# Wait for completion
/pm:issue-complete prayer-web-app 7

# Issue 3 (now ready)
/pm:issue-focus prayer-web-app 8
```

**vs. Parallel Mode:**
```bash
# Start everything ready at once
/pm:epic-start prayer-web-app
# Monitors multiple issues in parallel
```

## Important Notes

- **One issue at a time**: No other issues launch while this is focused
- **Still parallel streams**: A single issue can have multiple parallel streams
- **Same commit pattern**: Follows the analysis → implementation → execution pattern
- **Same GitHub comments**: Each stream adds progress comments
- **Execution tracking**: Only tracks the focused issue
- **Clear focus**: Easier to manage and coordinate work

## Error Handling

If the issue has unmet dependencies:
```
⚠️  Issue #$ISSUE_NUM has unmet dependencies:
    - Issue #X (status: {status})
    - Issue #Y (status: {status})

Cannot proceed until dependencies are complete.

View dependency status:
  /pm:epic-status $EPIC

Check issue status:
  gh issue view $ISSUE_NUM
```

If issue is already complete:
```
⚠️  Issue #$ISSUE_NUM is already complete

Start a different issue:
  /pm:issue-focus $EPIC $OTHER_ISSUE_NUM

View next issue:
  /pm:next $EPIC
```
