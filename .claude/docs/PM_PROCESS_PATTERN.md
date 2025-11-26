# Complete PM Process Pattern Guide

This document describes the complete, improved PM (Project Management) process pattern that should be followed for all epic work. This pattern ensures clean git history, clear audit trails, and proper coordination between agents.

## Overview

The PM process follows this sequence for each issue within an epic:

1. **Planning Phase**: Create and commit analysis files
2. **Implementation Phase**: Launch agents to implement streams
3. **Documentation Phase**: Create execution reports and GitHub comments
4. **Completion Phase**: Finalize tracking and mark complete

## Detailed Process

### Phase 1: Planning (Analysis Files)

#### Step 1.1: Create Analysis Files

For each ready issue, create a comprehensive analysis file:

```
.claude/epics/{epic}/{issue}-analysis.md
```

The analysis file should include:
- Stream breakdown (list all parallel work streams)
- Scope for each stream
- Dependencies between streams
- Integration points
- Implementation strategy

**Important:** Analysis files are created before agents start work.

#### Step 1.2: Commit Analysis Files (CRITICAL)

**This is the most important step.** Analysis files MUST be committed immediately after creation, BEFORE launching agents.

```bash
git add .claude/epics/{epic}/{issue}-analysis.md
git commit -m "Issue #{issue}: Add analysis and execution tracking files

- Add work stream analysis for Issue #{issue}
- Lists all parallel streams and their scope
- Provides implementation strategy and coordination points

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

**Why this matters:**
- Creates an audit trail showing the plan BEFORE implementation
- Prevents analysis files from remaining untracked
- Allows reviewers to verify implementation matches analysis
- Ensures git history shows: analysis → implementation → execution
- Makes it easy to spot when scope creep occurs

**Example git history (CORRECT):**
```
d61cc0f - Issue #3: Add analysis and execution tracking files
         ├─ 3-analysis.md ✓
         └─ execution-status.md ✓
5572d2a - Issue #3: Complete Stream 2
         ├─ Implementation code
         └─ Stream 2 changes
a6cd87e - Issue #3: Create server-side Appwrite client
         ├─ Implementation code
         └─ Stream 1 changes
```

### Phase 2: Implementation (Agent Work)

#### Step 2.1: Launch Agents with Analysis as Reference

For each stream in the analysis file, launch an agent:

```yaml
Task:
  description: "Issue #{issue} Stream {X}"
  subagent_type: "general-purpose"
  prompt: |
    Working in branch: epic/{epic}
    Issue: #{issue} - {title}
    Stream: {stream_name}

    Your scope:
    - Files: {file_patterns}
    - Work: {stream_description}

    Requirements:
    - .claude/epics/{epic}/{issue}.md
    - .claude/epics/{epic}/{issue}-analysis.md

    Coordination:
    - See /rules/agent-coordination.md
    - Update .claude/epics/{epic}/updates/{issue}/stream-{X}.md

    Commits:
    "Issue #{issue}: {specific change}"

    GitHub Comments:
    When complete, add progress comment (see section 7 of /pm:epic-start)
```

#### Step 2.2: Agents Implement Code

Each agent:
- Reads the analysis file to understand overall strategy
- Implements their assigned stream
- Makes focused commits for each logical change
- Updates progress tracking file
- Adds GitHub issue comment when complete

**Commit format for agents:**
```
Issue #{issue}: {feature description}

- {change 1}
- {change 2}

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>
```

### Phase 3: Documentation (Execution Reports)

#### Step 3.1: Create Execution Report

When an issue is complete, create an execution report:

```
.claude/epics/{epic}/{issue}-execution.md
```

The execution report should document:
- Summary of what was accomplished
- All streams and their status
- Files created and modified
- Key features implemented
- Testing results
- Acceptance criteria verification
- Integration points with other issues
- Performance characteristics

#### Step 3.2: Commit Execution Report

```bash
git add .claude/epics/{epic}/{issue}-execution.md
git commit -m "Issue #{issue}: Add execution tracking and completion report

- Comprehensive execution report for Issue #{issue}
- Documents all streams and their completion status
- Lists all files created and modified
- Includes deliverables, testing, and validation
- Integration points with other issues
- Performance characteristics
- Acceptance criteria verification

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

### Phase 4: GitHub Progress Comments

#### Format for Each Stream Completion

When a stream is complete, add a GitHub issue comment:

```markdown
### Progress Update {N}: Stream {X} - {Description}

**Time:** {timestamp}
**Status:** ✅ Completed

**Summary:**
Brief description of what was accomplished in this stream.

**Files Created:**
- `lib/path/file1.ts` - Description
- `lib/path/file2.ts` - Description

**Key Features:**
- Feature A implemented with details
- Feature B implemented with details

**Testing Status:**
✅ All tests passing
- Unit tests: {count} passed
- Integration tests: {count} passed

**Acceptance Criteria Met:**
- [x] Criterion 1
- [x] Criterion 2
- [x] Criterion 3
```

**Command to add comment:**
```bash
gh issue comment {issue_number} -b "$(cat <<'EOF'
### Progress Update {N}: Stream {X} - {Description}
...content...
EOF
)"
```

**Why GitHub comments matter:**
- Real-time visibility for stakeholders
- Clear record of what was accomplished per stream
- Integration with GitHub workflow
- Easy to reference in PR reviews
- No need to check git for progress updates
- One comment per stream (not merged)

## Complete Git Commit Timeline

For each issue, commits should appear in this order:

```
1. Issue #X: Add analysis and execution tracking files
   ├─ {issue}-analysis.md ✓
   └─ execution-status.md update ✓

2. Issue #X: Implement {feature} - Stream 1
   └─ Stream 1 implementation code

3. Issue #X: Implement {feature} - Stream 2
   └─ Stream 2 implementation code

4. Issue #X: Implement {feature} - Stream 3
   └─ Stream 3 implementation code

5. Issue #X: Add execution tracking and completion report
   ├─ {issue}-execution.md ✓
   └─ Results documented ✓

6. Track: Mark Issue #X complete
   └─ execution-status.md update
```

**Not allowed:**
```
❌ Issue #X: Implement feature (includes untracked analysis.md)
❌ Analysis files created but not committed
❌ Execution reports without dedicated commit
❌ GitHub comments missing for completed streams
```

## Process Checklist

Use this checklist for every epic/issue:

### Before Launching Agents
- [ ] Analysis files created for all ready issues
- [ ] Analysis files committed with dedicated commits
- [ ] Each analysis file has clear stream breakdown
- [ ] Dependencies documented in analysis
- [ ] execution-status.md created and committed

### During Agent Work
- [ ] Agents launched with analysis files committed
- [ ] Each agent references the analysis file
- [ ] Agents make focused, logical commits
- [ ] Progress tracked in updates/{issue}/stream-{X}.md
- [ ] No untracked analysis files left

### After Agent Completion
- [ ] Execution reports created
- [ ] Execution reports committed with dedicated commits
- [ ] GitHub issue comments added for each stream
- [ ] Each comment documents stream accomplishments
- [ ] execution-status.md updated to mark complete

### Final Review
- [ ] All commits follow standard message format
- [ ] All GitHub comments follow standard format
- [ ] No untracked files in repo
- [ ] git log shows clear progression: analysis → implementation → execution
- [ ] Ready for next issue in epic

## Why This Pattern Matters

### 1. Audit Trail
- Clear record of what was planned before implementation
- Reviewers can verify implementation matches analysis
- Scope disputes resolved by checking analysis file
- Disputes about decisions have historical context

### 2. Version Control Integrity
- Analysis committed when created, not retroactively
- Git history reflects actual workflow accurately
- No accidental untracked files
- Clear separation between planning and execution

### 3. Process Consistency
- All issues follow same pattern
- Easy to spot when pattern is broken
- Training is straightforward: "follow the pattern"
- New team members understand expectations

### 4. Future Reference
- Someone reviewing git in 6 months sees complete story
- No ambiguity about what was committed when
- Can trace decisions back to analysis
- Clear integration points documented

### 5. CI/CD Integration
- Automated checks can verify analysis exists before agents launch
- Prevent launching agents without documented plan
- Catch scope creep early
- Enforce commit message standards

### 6. GitHub Integration
- Stakeholders see progress without checking git
- Issue tracking reflects actual work done
- Easy to reference in discussions
- Real-time visibility of stream completions

## Common Mistakes to Avoid

### ❌ Mistake 1: Not Committing Analysis Files
```bash
# WRONG:
Create analysis file
Launch agents immediately
# Result: Analysis files remain untracked

# CORRECT:
Create analysis file
Commit analysis file
Launch agents
```

### ❌ Mistake 2: Merging Analysis Commit with Implementation
```bash
# WRONG:
Issue #3: Implement feature
├─ Implementation code
└─ Also includes 3-analysis.md (shouldn't be here!)

# CORRECT:
Issue #3: Add analysis and execution tracking files
├─ 3-analysis.md

Issue #3: Implement feature
└─ Implementation code only
```

### ❌ Mistake 3: Forgetting GitHub Comments
```bash
# WRONG:
Agent completes stream, makes git commits, does nothing else
GitHub issue shows no progress

# CORRECT:
Agent completes stream
Makes git commits
Adds GitHub issue comment with summary
GitHub shows completion details
```

### ❌ Mistake 4: One Comment for All Streams
```bash
# WRONG:
### Progress Update: All Streams Complete
- Did stream 1
- Did stream 2
- Did stream 3

# CORRECT:
### Progress Update 1: Stream 1 - {Description}
- Details for stream 1

### Progress Update 2: Stream 2 - {Description}
- Details for stream 2

### Progress Update 3: Stream 3 - {Description}
- Details for stream 3
```

## Implementation in `/pm:epic-start` Command

The `/pm:epic-start` command should implement this pattern:

```bash
# 1. Check epic exists
# 2. Create/checkout branch
# 3. For each ready issue:
#    a. Create analysis file
#    b. COMMIT analysis file (section 3.5)
#    c. Launch agents (section 4)
# 4. Create and commit execution-status.md (section 5.5)
# 5. Monitor execution (section 6)
# 6. When streams complete, verify GitHub comments (section 7)
# 7. Create and commit execution reports (section 3.2)
```

## Commands Reference

### Create and Commit Analysis
```bash
# Create analysis file (Task tool or manual)
# Then commit:
git add .claude/epics/{epic}/{issue}-analysis.md
git commit -m "Issue #{issue}: Add analysis and execution tracking files

- Add work stream analysis for Issue #{issue}
- Lists all parallel streams and their scope
- Provides implementation strategy and coordination points

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

### Agents Add GitHub Comments
```bash
gh issue comment {issue_number} -b "$(cat <<'EOF'
### Progress Update {N}: Stream {X} - {Description}
...content...
EOF
)"
```

### Create and Commit Execution Report
```bash
git add .claude/epics/{epic}/{issue}-execution.md
git commit -m "Issue #{issue}: Add execution tracking and completion report

- Comprehensive execution report for Issue #{issue}
- Documents all streams and their completion status
- Lists all files created and modified

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

## Migration from Old Pattern

If you have issues that don't follow this pattern:

1. Create analysis files for completed issues
2. Commit them with the standard message
3. Create execution reports
4. Commit them with the standard message
5. Add missing GitHub comments
6. Document the migration in an issue

This ensures all issues follow the same standard going forward.

## Summary

The PM process pattern ensures:
- ✅ Analysis files committed before implementation starts
- ✅ Clear git history showing plan → implementation → execution
- ✅ GitHub issue comments for real-time progress visibility
- ✅ Execution reports documenting all work done
- ✅ Consistent, auditable workflow for all epics
- ✅ Easy to review and verify scope adherence
- ✅ Clear separation of concerns (planning vs execution)

Follow this pattern for all future epic work.
