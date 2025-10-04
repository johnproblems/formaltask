---
allowed-tools: Bash, Read, Write, LS
---

# Issue Start Interactive

Begin work on a GitHub issue with interactive Claude Code instances in separate terminals for each work stream.

## Usage
```
/pm:issue-start-interactive <issue_number>
```

## Key Difference from /pm:issue-start

| Feature | /pm:issue-start | /pm:issue-start-interactive |
|---------|----------------|----------------------------|
| Execution | Background sub-agents | Interactive Claude Code instances |
| User interaction | None (fire-and-forget) | Full (approve, guide, correct) |
| Monitoring | Progress files only | Real-time in terminals |
| Error handling | Agents fail or continue | You intervene immediately |
| Speed | Faster (no human wait) | Slower but more reliable |
| Best for | Well-defined tasks | Complex/uncertain tasks |

## Preflight Checklist

1. **Check if issue analysis exists:**
   ```bash
   test -f .claude/epics/*/$ARGUMENTS-analysis.md || echo "❌ Run: /pm:issue-analyze $ARGUMENTS first"
   ```

2. **Verify terminal multiplexer available:**
   ```bash
   if command -v tmux >/dev/null 2>&1; then
     MULTIPLEXER="tmux"
   elif command -v screen >/dev/null 2>&1; then
     MULTIPLEXER="screen"
   else
     MULTIPLEXER="none"
     echo "⚠️ No tmux/screen found. Will use manual terminal spawning."
   fi
   ```

3. **Check Claude Code is available:**
   ```bash
   command -v claude >/dev/null 2>&1 || echo "❌ Claude Code CLI not found in PATH"
   ```

## Instructions

### 1. Read Analysis and Find Epic

Find the task file and epic:
```bash
# Find task file
task_file=$(find .claude/epics -name "$ARGUMENTS.md" -type f | head -1)
[ -z "$task_file" ] && echo "❌ Task file not found for issue #$ARGUMENTS" && exit 1

# Extract epic name from path
epic_name=$(echo "$task_file" | sed 's|.claude/epics/||' | cut -d/ -f1)

# Read analysis
analysis_file=".claude/epics/$epic_name/$ARGUMENTS-analysis.md"
[ ! -f "$analysis_file" ] && echo "❌ Analysis not found. Run: /pm:issue-analyze $ARGUMENTS" && exit 1
```

### 2. Parse Work Streams from Analysis

Extract parallel work streams:
```bash
# Parse analysis file to identify streams
# Expected format:
# ### Stream A: {name}
# - Files: {patterns}
# - Description: {text}

# Store stream info
declare -a stream_names
declare -a stream_files
declare -a stream_descriptions

# Parse (simplified - you'd enhance this)
while IFS= read -r line; do
  if [[ "$line" =~ ^###\ Stream\ ([A-Z]):\ (.+)$ ]]; then
    stream_id="${BASH_REMATCH[1]}"
    stream_name="${BASH_REMATCH[2]}"
    stream_names+=("$stream_id:$stream_name")
  fi
done < "$analysis_file"
```

### 3. Create Stream Worktrees

For each stream, create an isolated worktree:
```bash
# Ensure main epic worktree exists
main_worktree="../epic-$epic_name"
if ! git worktree list | grep -q "$main_worktree"; then
  echo "❌ Main epic worktree not found. Run: /pm:epic-start $epic_name"
  exit 1
fi

# Create stream worktrees from the main epic branch
for stream_info in "${stream_names[@]}"; do
  stream_id=$(echo "$stream_info" | cut -d: -f1)
  stream_name=$(echo "$stream_info" | cut -d: -f2)

  worktree_path="../stream-$ARGUMENTS-$stream_id"
  branch_name="stream/$ARGUMENTS-$stream_id"

  # Create worktree branching from epic branch
  git worktree add "$worktree_path" -b "$branch_name" "epic/$epic_name"

  echo "✅ Created worktree: $worktree_path"
done
```

### 4. Setup Progress Tracking

Create progress tracking structure:
```bash
mkdir -p ".claude/epics/$epic_name/updates/$ARGUMENTS"

# Create stream instructions for each worktree
for stream_info in "${stream_names[@]}"; do
  stream_id=$(echo "$stream_info" | cut -d: -f1)
  stream_name=$(echo "$stream_info" | cut -d: -f2)

  cat > "../stream-$ARGUMENTS-$stream_id/.claude-stream-context.md" << EOF
# Stream $stream_id: $stream_name

## Your Assignment
You are working on **Issue #$ARGUMENTS - Stream $stream_id**

## Your Scope
- Files to modify: {patterns from analysis}
- Work to complete: {description from analysis}

## Task Details
Read the full task from: $task_file

## Coordination Rules
1. **Stay in your lane**: Only modify files in your scope
2. **Commit frequently**: Use format "Issue #$ARGUMENTS Stream $stream_id: {change}"
3. **Update progress**: Log progress in .claude/epics/$epic_name/updates/$ARGUMENTS/stream-$stream_id.md
4. **Check for conflicts**: Before modifying shared files, run: git pull --rebase
5. **Ask for help**: If you need to modify files outside your scope, ask the user

## Other Streams
{List other streams and their file scopes}

## Progress Tracking
Update this file as you work:
.claude/epics/$epic_name/updates/$ARGUMENTS/stream-$stream_id.md

Format:
## Completed
- {what you've done}

## Working On
- {current task}

## Blocked
- {any blockers}

## Coordination Needed
- {if you need another stream's work}
EOF

  # Create progress tracking file
  cat > ".claude/epics/$epic_name/updates/$ARGUMENTS/stream-$stream_id.md" << EOF
---
issue: $ARGUMENTS
stream: $stream_id
name: $stream_name
started: $(date -u +"%Y-%m-%dT%H:%M:%SZ")
status: in_progress
worktree: ../stream-$ARGUMENTS-$stream_id
---

# Stream $stream_id: $stream_name

## Completed
- Worktree created
- Starting implementation

## Working On
- Reading task requirements

## Blocked
- None

## Coordination Needed
- None
EOF
done
```

### 5. Launch Interactive Claude Code Instances

Get current datetime: `date -u +"%Y-%m-%dT%H:%M:%SZ"`

**Option A: Using tmux (Recommended)**
```bash
if [ "$MULTIPLEXER" = "tmux" ]; then
  # Create a new tmux session
  session_name="issue-$ARGUMENTS"

  tmux new-session -d -s "$session_name" -n "orchestrator"
  tmux send-keys -t "$session_name:orchestrator" "cd $(pwd)" C-m
  tmux send-keys -t "$session_name:orchestrator" "watch -n 10 'cat .claude/epics/$epic_name/updates/$ARGUMENTS/stream-*.md'" C-m

  # Create window for each stream
  window_num=1
  for stream_info in "${stream_names[@]}"; do
    stream_id=$(echo "$stream_info" | cut -d: -f1)
    stream_name=$(echo "$stream_info" | cut -d: -f2)
    worktree_path="../stream-$ARGUMENTS-$stream_id"

    window_name="stream-$stream_id"
    tmux new-window -t "$session_name:$window_num" -n "$window_name"
    tmux send-keys -t "$session_name:$window_name" "cd $worktree_path" C-m
    tmux send-keys -t "$session_name:$window_name" "# Stream $stream_id: $stream_name" C-m
    tmux send-keys -t "$session_name:$window_name" "# Read context: cat .claude-stream-context.md" C-m
    tmux send-keys -t "$session_name:$window_name" "claude" C-m

    window_num=$((window_num + 1))
  done

  # Attach to session
  echo ""
  echo "✅ Created tmux session: $session_name"
  echo ""
  echo "Windows:"
  echo "  0: orchestrator (progress monitor)"
  for stream_info in "${stream_names[@]}"; do
    stream_id=$(echo "$stream_info" | cut -d: -f1)
    stream_name=$(echo "$stream_info" | cut -d: -f2)"
    echo "  $((window_num-1)): stream-$stream_id ($stream_name)"
  done
  echo ""
  echo "Attach with: tmux attach -t $session_name"
  echo "Switch windows: Ctrl+b <number>"
  echo "Detach: Ctrl+b d"
  echo ""

  # Ask if user wants to attach now
  read -p "Attach to tmux session now? (y/n): " attach
  if [[ "$attach" =~ ^[Yy]$ ]]; then
    tmux attach -t "$session_name"
  fi
fi
```

**Option B: Manual Terminal Spawning (Fallback)**
```bash
if [ "$MULTIPLEXER" = "none" ]; then
  echo ""
  echo "⚠️ No tmux/screen detected. Manual terminal spawning:"
  echo ""
  echo "Open separate terminals and run:"
  echo ""

  for stream_info in "${stream_names[@]}"; do
    stream_id=$(echo "$stream_info" | cut -d: -f1)
    stream_name=$(echo "$stream_info" | cut -d: -f2)"
    worktree_path="../stream-$ARGUMENTS-$stream_id"

    echo "Terminal for Stream $stream_id ($stream_name):"
    echo "  cd $worktree_path"
    echo "  cat .claude-stream-context.md  # Read your assignment"
    echo "  claude"
    echo ""
  done

  echo "Monitor progress in this terminal:"
  echo "  watch -n 10 'cat .claude/epics/$epic_name/updates/$ARGUMENTS/stream-*.md'"
  echo ""
fi
```

### 6. Update Task Frontmatter

Update main task file to reflect interactive start:
```bash
# Update task file frontmatter
current_date=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
sed -i "s/^status: .*/status: in_progress/" "$task_file"
sed -i "s/^updated: .*/updated: $current_date/" "$task_file"
```

### 7. Update GitHub Issue

```bash
# Mark GitHub issue as in-progress
gh issue edit $ARGUMENTS --add-assignee @me --add-label "in-progress"
```

### 8. Output Summary

```
✅ Started interactive parallel work on Issue #$ARGUMENTS

Epic: $epic_name
Task: {task_name}

Work Streams:
  Stream A: {name} → ../stream-$ARGUMENTS-A
  Stream B: {name} → ../stream-$ARGUMENTS-B
  Stream C: {name} → ../stream-$ARGUMENTS-C

Each stream is running in an interactive Claude Code instance.
You can:
  - Approve/reject tool usage
  - Ask questions and provide guidance
  - Correct mistakes in real-time
  - Monitor progress files

Tmux Session: issue-$ARGUMENTS
  - Switch between streams: Ctrl+b <window-number>
  - Orchestrator (window 0): Progress monitor
  - Stream windows (1-N): Interactive Claude Code

Progress Tracking:
  .claude/epics/$epic_name/updates/$ARGUMENTS/stream-*.md

When streams complete:
  1. Review work in each worktree
  2. Run: /pm:issue-merge-streams $ARGUMENTS
  3. This merges all streams back to epic branch
  4. Then: /pm:issue-sync $ARGUMENTS to update GitHub

To stop:
  - Ctrl+c in each Claude Code window
  - Or: tmux kill-session -t issue-$ARGUMENTS
```

## Coordination During Work

As you work in each stream:

1. **Monitor orchestrator window**: Shows real-time progress from all streams
2. **Switch between streams**: Ctrl+b <number> in tmux
3. **Check coordination**: If stream needs another's work, it updates progress file
4. **Manual intervention**: You guide each Claude instance as needed

## Merging Streams Back

When all streams complete, merge them:
```bash
/pm:issue-merge-streams $ARGUMENTS
```

This command:
1. Checks all streams are complete
2. Merges stream branches to epic branch
3. Handles conflicts (with your help)
4. Updates progress tracking
5. Cleans up stream worktrees

## Benefits Over Standard /pm:issue-start

✅ **Full supervision**: Approve each tool use
✅ **Real-time intervention**: Catch and fix mistakes immediately
✅ **Interactive guidance**: Answer Claude's questions
✅ **Better quality**: Human oversight reduces errors
✅ **Still parallel**: Multiple streams work simultaneously
✅ **Flexible**: Pause/resume/redirect any stream

## Trade-offs

⚠️ **Slower**: Human interaction adds latency
⚠️ **More complex**: Managing multiple terminals
⚠️ **Requires focus**: Can't leave it running unattended

## Use Cases

**Use interactive mode when:**
- Complex architecture requiring iteration
- High uncertainty in requirements
- Novel patterns (not boilerplate)
- Learning/experimenting
- Mission-critical code

**Use standard autonomous mode when:**
- Well-defined boilerplate
- Low risk of errors
- Repetitive tasks
- Time is critical
- Tasks are independent

## Example Workflow

```bash
# Analyze the issue
/pm:issue-analyze 001

# Review analysis
cat .claude/epics/*/001-analysis.md

# Start interactive parallel work
/pm:issue-start-interactive 001

# [Tmux session opens]
# Window 0: Progress monitor
# Window 1: Stream A (you guide Claude)
# Window 2: Stream B (you guide Claude)
# Window 3: Stream C (you guide Claude)

# Work in each stream, switching with Ctrl+b <number>

# When all complete
/pm:issue-merge-streams 001

# Sync to GitHub
/pm:issue-sync 001
```
