# GitHub Branch Protection Rules

## Recommended Configuration

To ensure code quality and enforce the CI/CD pipeline, configure the following branch protection rules for your main branches (`main`, `enhancements`, `develop`).

## Branch Protection Settings

### 1. Require Pull Request Before Merging

**Settings → Branches → Branch protection rules → Add rule**

- **Branch name pattern**: `main` (create separate rules for `enhancements` and `develop`)
- ✅ **Require a pull request before merging**
  - ✅ **Require approvals**: 1
  - ✅ **Dismiss stale pull request approvals when new commits are pushed**
  - ✅ **Require review from Code Owners** (if using CODEOWNERS file)

### 2. Require Status Checks to Pass

- ✅ **Require status checks to pass before merging**
  - ✅ **Require branches to be up to date before merging**
  - Required status checks:
    - `Lint`
    - `Build on ubuntu-latest`
    - `Build on macos-latest`
    - `Build on windows-latest`
    - `Test on ubuntu-latest`
    - `Test on macos-latest`
    - `Test on windows-latest`
    - `Code Coverage Enforcement`
    - `Quality Gate`

### 3. Additional Protection Rules

- ✅ **Require conversation resolution before merging**
- ✅ **Require signed commits** (recommended for security)
- ✅ **Require linear history** (optional, prevents merge commits)
- ✅ **Do not allow bypassing the above settings**
- ✅ **Restrict who can push to matching branches** (optional, limit to maintainers)

### 4. Status Check Configuration Details

The CI pipeline must complete successfully before merging:

1. **Linting** - ESLint checks must pass
2. **Multi-platform Builds** - Extension must build successfully on all platforms
3. **Multi-platform Tests** - All tests must pass on all platforms
4. **Coverage Enforcement** - Code coverage must meet 90%+ threshold
5. **Quality Gate** - Overall quality gate must pass

## Setup Instructions

### Step 1: Navigate to Repository Settings

1. Go to your GitHub repository: `https://github.com/johnproblems/formaltask`
2. Click **Settings** (requires admin access)
3. Navigate to **Branches** in the left sidebar

### Step 2: Add Branch Protection Rule

1. Click **Add rule** or **Add branch protection rule**
2. Enter branch name pattern: `main`
3. Configure the settings as outlined above
4. Click **Create** or **Save changes**

### Step 3: Repeat for Other Branches

Create separate rules for:
- `enhancements`
- `develop`

Use the same configuration for consistency.

### Step 4: Configure Codecov (Optional)

If using Codecov for coverage reporting:

1. Go to [Codecov](https://codecov.io/)
2. Sign in with GitHub
3. Enable the `formaltask` repository
4. Add `CODECOV_TOKEN` secret to GitHub repository:
   - Repository Settings → Secrets and variables → Actions → New repository secret
   - Name: `CODECOV_TOKEN`
   - Value: Your Codecov token

## Testing Branch Protection

To test the branch protection rules:

1. Create a new feature branch:
   ```bash
   git checkout -b test/branch-protection
   ```

2. Make a small change to trigger CI:
   ```bash
   echo "# Test" >> vscode-extension/README.md
   git add vscode-extension/README.md
   git commit -m "test: verify branch protection"
   git push -u origin test/branch-protection
   ```

3. Create a pull request targeting `main` or `enhancements`

4. Verify that:
   - All CI checks run automatically
   - Merging is blocked until checks pass
   - Approvals are required (if configured)

## Troubleshooting

### Status Checks Not Appearing

If required status checks don't appear in the dropdown:

1. The CI workflow must run at least once
2. Push a commit to trigger the workflow
3. Wait for workflow to complete
4. Return to branch protection settings - checks should now be available

### Workflow Not Running

If the workflow doesn't trigger:

1. Verify GitHub Actions is enabled: **Settings → Actions → General**
2. Check workflow file path: `.github/workflows/ci.yml`
3. Verify workflow syntax with: `yamllint .github/workflows/ci.yml`
4. Check the **Actions** tab for error messages

### Coverage Check Failing

If coverage consistently fails at 90%:

1. Review coverage reports in artifacts
2. Add tests for uncovered code
3. Temporarily adjust threshold in `.nycrc.json` (not recommended)
4. Run locally: `npm run test:coverage && npm run coverage:check`

## Best Practices

### For Contributors

1. **Run tests locally** before pushing:
   ```bash
   npm run ci
   ```

2. **Check coverage** before submitting PR:
   ```bash
   npm run test:coverage
   npm run coverage:report
   ```

3. **Ensure clean lint** before committing:
   ```bash
   npm run lint
   ```

### For Maintainers

1. **Never bypass branch protection** - even for hotfixes
2. **Review coverage reports** in PR comments
3. **Require conversation resolution** before approving
4. **Monitor CI pipeline** performance and costs
5. **Keep dependencies updated** for security

## Emergency Bypass

In exceptional circumstances (critical hotfix, CI outage):

1. Admin can temporarily disable branch protection
2. Apply emergency fix
3. **Immediately re-enable** branch protection
4. Create follow-up PR with proper testing
5. Document the bypass in incident log

**Note**: Emergency bypass should be extremely rare and always documented.

## Additional Resources

- [GitHub Branch Protection Documentation](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-protected-branches)
- [GitHub Actions Status Checks](https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/collaborating-on-repositories-with-code-quality-features/about-status-checks)
- [Codecov Documentation](https://docs.codecov.com/docs)
- [VS Code Extension CI/CD Best Practices](https://code.visualstudio.com/api/working-with-extensions/continuous-integration)

## Related Documentation

- [CI/CD Pipeline Configuration](.github/workflows/ci.yml)
- [Extension Testing Guide](vscode-extension/TESTING.md)
- [Coverage Configuration](vscode-extension/.nycrc.json)
