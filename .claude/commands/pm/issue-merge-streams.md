---
allowed-tools: Bash, Read, Write
---

# Issue Merge Streams

Merge completed work streams back into the main epic branch.

## Usage
```
/pm:issue-merge-streams <issue_number>
```

## Instructions

### 1. Validate All Streams Complete

```bash
# Find epic name
task_file=$(find .claude/epics -name "$ARGUMENTS.md" -type f | head -1)
epic_name=$(echo "$task_file" | sed 's|.claude/epics/||' | cut -d/ -f1)

# Check all stream progress files
all_complete=true
for progress_file in .claude/epics/$epic_name/updates/$ARGUMENTS/stream-*.md; do
  [ ! -f "$progress_file" ] && continue

  status=$(grep '^status:' "$progress_file" | awk '{print $2}')
  stream_id=$(grep '^stream:' "$progress_file" | awk '{print $2}')

  if [ "$status" != "completed" ]; then
    echo "⚠️ Stream $stream_id not complete (status: $status)"
    all_complete=false
  fi
done

if [ "$all_complete" = false ]; then
  echo ""
  echo "❌ Not all streams are complete."
  echo "Mark streams as complete in their progress files, or continue anyway? (yes/no)"
  read -r response
  [[ ! "$response" =~ ^[Yy] ]] && exit 1
fi
```

### 2. Switch to Epic Worktree

```bash
cd "../epic-$epic_name" || {
  echo "❌ Epic worktree not found: ../epic-$epic_name"
  exit 1
}

# Ensure we're on the epic branch
git checkout "epic/$epic_name"
git pull origin "epic/$epic_name" 2>/dev/null || true
```

### 3. Merge Each Stream

```bash
for progress_file in ../.claude/epics/$epic_name/updates/$ARGUMENTS/stream-*.md; do
  [ ! -f "$progress_file" ] && continue

  stream_id=$(grep '^stream:' "$progress_file" | awk '{print $2}')
  stream_name=$(grep '^name:' "$progress_file" | cut -d: -f2- | sed 's/^ *//')

  echo ""
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "Merging Stream $stream_id: $stream_name"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo ""

  # Show what's being merged
  git log --oneline "epic/$epic_name..stream/$ARGUMENTS-$stream_id" 2>/dev/null || {
    echo "⚠️ No commits in stream $stream_id, skipping"
    continue
  }

  # Attempt merge
  if git merge "stream/$ARGUMENTS-$stream_id" --no-ff -m "Issue #$ARGUMENTS Stream $stream_id: Merge $stream_name"; then
    echo "✅ Stream $stream_id merged successfully"
  else
    echo "❌ Merge conflict in stream $stream_id"
    echo ""
    echo "Conflicted files:"
    git diff --name-only --diff-filter=U
    echo ""
    echo "Resolve conflicts:"
    echo "  1. Edit conflicted files"
    echo "  2. git add <files>"
    echo "  3. git commit"
    echo "  4. Re-run: /pm:issue-merge-streams $ARGUMENTS"
    echo ""
    echo "Or abort this merge:"
    echo "  git merge --abort"
    exit 1
  fi
done
```

### 4. Push Merged Changes

```bash
# Push to remote
git push origin "epic/$epic_name"

echo ""
echo "✅ All streams merged to epic/$epic_name"
```

### 5. Update Progress Tracking

```bash
cd - # Back to main repo

# Mark all streams as merged
current_date=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

for progress_file in .claude/epics/$epic_name/updates/$ARGUMENTS/stream-*.md; do
  [ ! -f "$progress_file" ] && continue

  sed -i "s/^status: .*/status: merged/" "$progress_file"
  echo "merged: $current_date" >> "$progress_file"
done
```

### 6. Clean Up Stream Worktrees

```bash
# Ask user if they want to remove worktrees
echo ""
echo "Clean up stream worktrees? (yes/no)"
read -r cleanup

if [[ "$cleanup" =~ ^[Yy] ]]; then
  for progress_file in .claude/epics/$epic_name/updates/$ARGUMENTS/stream-*.md; do
    [ ! -f "$progress_file" ] && continue

    stream_id=$(grep '^stream:' "$progress_file" | awk '{print $2}')
    worktree_path="../stream-$ARGUMENTS-$stream_id"

    if [ -d "$worktree_path" ]; then
      git worktree remove "$worktree_path" --force
      echo "✅ Removed worktree: $worktree_path"
    fi

    # Delete stream branch
    git branch -D "stream/$ARGUMENTS-$stream_id" 2>/dev/null || true
  done
fi
```

### 7. Update Task Status

```bash
# Update task file
task_file=$(find .claude/epics -name "$ARGUMENTS.md" -type f | head -1)
current_date=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

sed -i "s/^updated: .*/updated: $current_date/" "$task_file"

# Optionally mark as completed if all work is done
echo ""
echo "Mark issue #$ARGUMENTS as completed? (yes/no)"
read -r complete

if [[ "$complete" =~ ^[Yy] ]]; then
  sed -i "s/^status: .*/status: completed/" "$task_file"
  echo "✅ Task marked as completed"
fi
```

### 8. Output Summary

```
✅ Stream merge completed for Issue #$ARGUMENTS

Merged streams:
  Stream A: {name} ✓
  Stream B: {name} ✓
  Stream C: {name} ✓

All changes now in: epic/$epic_name
Epic worktree: ../epic-$epic_name

Next steps:
  1. Review merged code in epic worktree
  2. Run tests: cd ../epic-$epic_name && cargo test
  3. Sync to GitHub: /pm:issue-sync $ARGUMENTS
  4. When epic complete: /pm:epic-merge $epic_name
```

## Error Handling

If merge fails:
- Conflicts are reported with file names
- Manual resolution required
- Re-run command after resolving
- Or abort with `git merge --abort`

## Best Practices

1. **Review before merging**: Check each stream's work
2. **Run tests**: Before marking complete
3. **Commit messages**: Ensure they reference issue number
4. **Conflict resolution**: Understand both changes before choosing
5. **Incremental merging**: Merge streams one at a time if preferred
