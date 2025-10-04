---
allowed-tools: Bash, Read, Write, LS, Task
---

# Epic Decompose

Break epic into concrete, actionable tasks.

## Usage
```
/pm:epic-decompose <feature_name>
```

## Required Rules

**IMPORTANT:** Before executing this command, read and follow:
- `.claude/rules/datetime.md` - For getting real current date/time

## Preflight Checklist

Before proceeding, complete these validation steps.
Do not bother the user with preflight checks progress ("I'm not going to ..."). Just do them and move on.

1. **Verify epic exists:**
   - Check if `.claude/epics/$ARGUMENTS/epic.md` exists
   - If not found, tell user: "❌ Epic not found: $ARGUMENTS. First create it with: /pm:prd-parse $ARGUMENTS"
   - Stop execution if epic doesn't exist

2. **Check for existing tasks:**
   - Check if any numbered task files (001.md, 002.md, etc.) already exist in `.claude/epics/$ARGUMENTS/`
   - If tasks exist, list them and ask: "⚠️ Found {count} existing tasks. Delete and recreate all tasks? (yes/no)"
   - Only proceed with explicit 'yes' confirmation
   - If user says no, suggest: "View existing tasks with: /pm:epic-show $ARGUMENTS"

3. **Validate epic frontmatter:**
   - Verify epic has valid frontmatter with: name, status, created, prd
   - If invalid, tell user: "❌ Invalid epic frontmatter. Please check: .claude/epics/$ARGUMENTS/epic.md"

4. **Check epic status:**
   - If epic status is already "completed", warn user: "⚠️ Epic is marked as completed. Are you sure you want to decompose it again?"

## Instructions

You are decomposing an epic into specific, actionable tasks for: **$ARGUMENTS**

### 0. Determine Starting Task Number

**IMPORTANT**: Task files must be numbered to match their future GitHub issue numbers.

Before creating tasks, check the highest existing GitHub issue number:

```bash
# Get the highest issue number from GitHub
highest_issue=$(gh issue list --repo $(git remote get-url origin | sed 's|.*github.com[:/]||' | sed 's|\.git$||') --limit 100 --state all --json number --jq 'max_by(.number) | .number')

# Next task should start at highest_issue + 1
start_number=$((highest_issue + 1))

echo "📊 Highest GitHub issue: #$highest_issue"
echo "🎯 Epic will be: #$start_number"
echo "📝 Tasks will start at: #$((start_number + 1))"
```

Then create task files starting from `$((start_number + 1))`:
- First task: `$((start_number + 1)).md`
- Second task: `$((start_number + 2)).md`
- Third task: `$((start_number + 3)).md`
- etc.

**Why**: The epic will be synced to GitHub and get issue #`$start_number`. Tasks must be numbered sequentially after the epic.

**Example**:
- If highest GitHub issue is #16
- Epic will become issue #17
- First task file should be `18.md` (will become issue #18)
- Second task file should be `19.md` (will become issue #19)

### 1. Read the Epic
- Load the epic from `.claude/epics/$ARGUMENTS/epic.md`
- Understand the technical approach and requirements
- Review the task breakdown preview

### 2. Analyze for Parallel Creation

Determine if tasks can be created in parallel:
- If tasks are mostly independent: Create in parallel using Task agents
- If tasks have complex dependencies: Create sequentially
- For best results: Group independent tasks for parallel creation

### 3. Parallel Task Creation (When Possible)

If tasks can be created in parallel, spawn sub-agents:

```yaml
Task:
  description: "Create task files batch {X}"
  subagent_type: "general-purpose"
  prompt: |
    Create task files for epic: $ARGUMENTS

    Tasks to create:
    - {list of 3-4 tasks for this batch}

    For each task:
    1. Create file: .claude/epics/$ARGUMENTS/{number}.md
    2. Use exact format with frontmatter and all sections
    3. Follow task breakdown from epic
    4. Set parallel/depends_on fields appropriately
    5. Number sequentially (001.md, 002.md, etc.)

    Return: List of files created
```

### 4. Task File Format with Frontmatter
For each task, create a file with this exact structure:

```markdown
---
name: [Task Title]
status: open
created: [Current ISO date/time]
updated: [Current ISO date/time]
github: [Will be updated when synced to GitHub]
depends_on: []  # List of task numbers this depends on, e.g., [001, 002]
parallel: true  # Can this run in parallel with other tasks?
conflicts_with: []  # Tasks that modify same files, e.g., [003, 004]
---

# Task: [Task Title]

## Description
Clear, concise description of what needs to be done

## Acceptance Criteria
- [ ] Specific criterion 1
- [ ] Specific criterion 2
- [ ] Specific criterion 3

## Technical Details
- Implementation approach
- Key considerations
- Code locations/files affected

## Dependencies
- [ ] Task/Issue dependencies
- [ ] External dependencies

## Effort Estimate
- Size: XS/S/M/L/XL
- Hours: estimated hours
- Parallel: true/false (can run in parallel with other tasks)

## Definition of Done
- [ ] Code implemented
- [ ] Tests written and passing
- [ ] Documentation updated
- [ ] Code reviewed
- [ ] Deployed to staging
```

### 3. Task Naming Convention
Save tasks as: `.claude/epics/$ARGUMENTS/{task_number}.md`
- Use the numbering determined in step 0 (based on GitHub issue numbers)
- Start at `$((start_number + 1)).md` where `start_number` is the epic's future issue number
- Number sequentially: If epic will be #17, tasks are 18.md, 19.md, 20.md, etc.
- Keep task titles short but descriptive

**IMPORTANT**: Do NOT use 001.md, 002.md, etc. Use actual GitHub issue numbers!

### 4. Frontmatter Guidelines
- **name**: Use a descriptive task title (without "Task:" prefix)
- **status**: Always start with "open" for new tasks
- **created**: Get REAL current datetime by running: `date -u +"%Y-%m-%dT%H:%M:%SZ"`
- **updated**: Use the same real datetime as created for new tasks
- **github**: Leave placeholder text - will be updated during sync
- **depends_on**: List task numbers that must complete before this can start (use actual GitHub issue numbers, e.g., [18, 19])
- **parallel**: Set to true if this can run alongside other tasks without conflicts
- **conflicts_with**: List task numbers that modify the same files (use actual GitHub issue numbers, e.g., [20, 21])

### 5. Task Types to Consider
- **Setup tasks**: Environment, dependencies, scaffolding
- **Data tasks**: Models, schemas, migrations
- **API tasks**: Endpoints, services, integration
- **UI tasks**: Components, pages, styling
- **Testing tasks**: Unit tests, integration tests
- **Documentation tasks**: README, API docs
- **Deployment tasks**: CI/CD, infrastructure

### 6. Parallelization
Mark tasks with `parallel: true` if they can be worked on simultaneously without conflicts.

### 7. Execution Strategy

Choose based on task count and complexity:

**Small Epic (< 5 tasks)**: Create sequentially for simplicity

**Medium Epic (5-10 tasks)**:
- Batch into 2-3 groups
- Spawn agents for each batch
- Consolidate results

**Large Epic (> 10 tasks)**:
- Analyze dependencies first
- Group independent tasks
- Launch parallel agents (max 5 concurrent)
- Create dependent tasks after prerequisites

Example for parallel execution:
```markdown
Spawning 3 agents for parallel task creation:
- Agent 1: Creating tasks 001-003 (Database layer)
- Agent 2: Creating tasks 004-006 (API layer)
- Agent 3: Creating tasks 007-009 (UI layer)
```

### 8. Task Dependency Validation

When creating tasks with dependencies:
- Ensure referenced dependencies exist (e.g., if Task 003 depends on Task 002, verify 002 was created)
- Check for circular dependencies (Task A → Task B → Task A)
- If dependency issues found, warn but continue: "⚠️ Task dependency warning: {details}"

### 9. Update Epic with Task Summary
After creating all tasks, update the epic file by adding this section:
```markdown
## Tasks Created
- [ ] 001.md - {Task Title} (parallel: true/false)
- [ ] 002.md - {Task Title} (parallel: true/false)
- etc.

Total tasks: {count}
Parallel tasks: {parallel_count}
Sequential tasks: {sequential_count}
Estimated total effort: {sum of hours}
```

Also update the epic's frontmatter progress if needed (still 0% until tasks actually start).

### 9. Quality Validation

Before finalizing tasks, verify:
- [ ] All tasks have clear acceptance criteria
- [ ] Task sizes are reasonable (1-3 days each)
- [ ] Dependencies are logical and achievable
- [ ] Parallel tasks don't conflict with each other
- [ ] Combined tasks cover all epic requirements

### 10. Post-Decomposition

After successfully creating tasks:
1. Confirm: "✅ Created {count} tasks for epic: $ARGUMENTS"
2. Show summary:
   - Total tasks created
   - Parallel vs sequential breakdown
   - Total estimated effort
3. Suggest next step: "Ready to sync to GitHub? Run: /pm:epic-sync $ARGUMENTS"

## Error Recovery

If any step fails:
- If task creation partially completes, list which tasks were created
- Provide option to clean up partial tasks
- Never leave the epic in an inconsistent state

Aim for tasks that can be completed in 1-3 days each. Break down larger tasks into smaller, manageable pieces for the "$ARGUMENTS" epic.

## Task Count Guidance

**IMPORTANT**: Use the task estimates from the PRD and epic, not arbitrary limits.

- Review the epic's "Task Breakdown Preview" section
- Review the PRD's estimated task counts per component
- Create the number of tasks specified in those estimates
- **DO NOT** artificially limit or consolidate tasks to meet a specific count
- **DO NOT** restrict to "10 or less" - use the actual estimates

Example:
- If PRD says "15-18 tasks", create 15-18 tasks
- If epic says "45-60 tasks", create 45-60 tasks
- If a component needs "6-8 tasks", create 6-8 tasks for that component

The goal is realistic, manageable tasks (1-3 days each), not a specific total count.
