# CI/CD Pipeline Documentation

## Overview

The CCPM VSCode Extension uses GitHub Actions for continuous integration and deployment. The pipeline enforces strict quality standards including 90%+ code coverage, multi-platform compatibility, and comprehensive testing.

## Pipeline Architecture

### Workflow File
`.github/workflows/ci.yml`

### Trigger Conditions

The CI pipeline runs on:
- **Push** to `main`, `enhancements`, or `develop` branches
- **Pull requests** targeting these branches
- **Manual trigger** via workflow_dispatch
- Only when changes affect:
  - `vscode-extension/**`
  - `.github/workflows/ci.yml`

## Pipeline Jobs

### 1. Lint Job

**Purpose**: Enforce code style and catch syntax errors early

**Platform**: `ubuntu-latest`

**Steps**:
1. Checkout code
2. Setup Node.js 20 with npm caching
3. Install dependencies
4. Run ESLint

**Failure conditions**:
- Linting errors or warnings
- ESLint configuration errors

### 2. Build Job

**Purpose**: Verify extension builds successfully on all target platforms

**Platform**: Matrix build across:
- `ubuntu-latest` (Linux)
- `macos-latest` (macOS)
- `windows-latest` (Windows)

**Steps**:
1. Checkout code
2. Setup Node.js 20 with npm caching
3. Install dependencies
4. Compile TypeScript
5. Package extension (production build)
6. Upload build artifacts

**Artifacts**:
- `extension-build-ubuntu-latest`
- `extension-build-macos-latest`
- `extension-build-windows-latest`
- Retained for 7 days

**Failure conditions**:
- TypeScript compilation errors
- Webpack bundling failures
- Platform-specific build issues

### 3. Test Job

**Purpose**: Run comprehensive test suites on all platforms

**Platform**: Matrix test across:
- `ubuntu-latest` (with Xvfb for headless testing)
- `macos-latest`
- `windows-latest`

**Steps**:
1. Checkout code
2. Setup Node.js 20 with npm caching
3. Install dependencies
4. Run unit tests
5. Run integration tests (with VS Code)

**Special handling**:
- Linux: Uses `xvfb-run` for headless VS Code testing
- macOS/Windows: Direct test execution

**Failure conditions**:
- Any test failures
- Test execution errors
- Platform-specific test issues

### 4. Coverage Job

**Purpose**: Enforce 90%+ code coverage threshold

**Platform**: `ubuntu-latest`

**Steps**:
1. Checkout code
2. Setup Node.js 20 with npm caching
3. Install dependencies
4. Run tests with nyc coverage
5. **Check 90%+ threshold** (pipeline fails if below)
6. Generate HTML and LCOV reports
7. Upload to Codecov
8. Upload coverage artifacts
9. Comment coverage summary on PR

**Coverage Requirements**:
- Lines: ≥90%
- Statements: ≥90%
- Functions: ≥90%
- Branches: ≥90%

**Artifacts**:
- `coverage-report` (HTML and LCOV)
- Retained for 30 days

**Failure conditions**:
- Coverage below 90% on any metric
- Coverage calculation errors

**PR Comments**:
Automatically posts coverage summary with:
- Overall percentage
- Pass/fail status
- Link to detailed report

### 5. Quality Gate Job

**Purpose**: Final validation that all quality checks passed

**Platform**: `ubuntu-latest`

**Dependencies**: Waits for all previous jobs

**Steps**:
1. Check results of all jobs
2. Fail if any job failed
3. Generate summary report

**Output**: GitHub Actions Summary with visual status

## Coverage Configuration

### nyc Configuration (`.nycrc.json`)

```json
{
  "extends": "@istanbuljs/nyc-config-typescript",
  "check-coverage": true,
  "lines": 90,
  "statements": 90,
  "functions": 90,
  "branches": 90,
  "watermarks": {
    "lines": [90, 100],
    "functions": [90, 100],
    "branches": [90, 100],
    "statements": [90, 100]
  }
}
```

### Coverage Watermarks

- **Red** (0-89%): Below threshold, fails CI
- **Green** (90-100%): Meets threshold, passes CI

## NPM Scripts

### CI-Specific Scripts

```bash
# Run complete CI pipeline locally
npm run ci

# Build for CI
npm run ci:build

# Run tests with coverage
npm run test:coverage

# Check coverage thresholds (90%+)
npm run coverage:check

# Generate coverage reports
npm run coverage:report
```

### Development Scripts

```bash
# Lint code
npm run lint

# Compile TypeScript
npm run compile

# Run unit tests
npm run test:unit

# Run integration tests
npm test

# Watch mode for tests
npm run test:watch
```

## Local Development Workflow

### Before Committing

```bash
# 1. Run linter
npm run lint

# 2. Run full CI locally
npm run ci

# 3. Check coverage details
npm run coverage:report
# Open coverage/index.html in browser
```

### Fixing Coverage Issues

```bash
# 1. Identify uncovered code
npm run test:coverage

# 2. Review HTML report
open coverage/index.html

# 3. Write tests for uncovered code

# 4. Verify coverage improved
npm run coverage:check
```

## Codecov Integration

### Setup

1. Enable repository on [Codecov.io](https://codecov.io)
2. Add `CODECOV_TOKEN` to GitHub Secrets:
   - Settings → Secrets and variables → Actions
   - New repository secret
   - Name: `CODECOV_TOKEN`
   - Value: Token from Codecov

### Features

- **Automatic uploads**: Every coverage job uploads reports
- **PR comments**: Coverage diff on pull requests
- **Trend tracking**: Coverage over time
- **Sunburst charts**: Visual coverage breakdown
- **File-level analysis**: Identify uncovered code

### Accessing Reports

- **Codecov Dashboard**: https://codecov.io/gh/johnproblems/formaltask
- **PR Comments**: Automatic on every pull request
- **Artifacts**: Download from GitHub Actions

## Troubleshooting

### Pipeline Failing on Coverage

**Symptoms**: Coverage job fails with "Coverage thresholds not met"

**Solutions**:
1. Run locally: `npm run test:coverage`
2. Check which files/functions are uncovered
3. Add tests to cover those areas
4. Verify: `npm run coverage:check`

### Build Failing on Specific Platform

**Symptoms**: Build succeeds on Ubuntu but fails on Windows

**Solutions**:
1. Check platform-specific path separators
2. Review webpack configuration for platform compatibility
3. Test locally on that platform (or use matrix locally)
4. Check GitHub Actions logs for specific errors

### Tests Passing Locally but Failing in CI

**Symptoms**: `npm test` works locally but fails in GitHub Actions

**Solutions**:
1. Check for environment-specific dependencies
2. Verify VS Code version compatibility
3. Review test timeouts (CI may be slower)
4. Check for file system case sensitivity issues
5. Ensure no hardcoded paths

### Lint Failures

**Symptoms**: Lint job fails but no local errors

**Solutions**:
1. Run `npm run lint` locally
2. Update ESLint cache: `rm -rf node_modules/.cache`
3. Check for uncommitted ESLint config changes
4. Verify Node.js version matches CI (v20)

### Coverage Reports Not Uploading

**Symptoms**: Codecov upload fails

**Solutions**:
1. Verify `CODECOV_TOKEN` is set correctly
2. Check Codecov service status
3. Review GitHub Actions logs for API errors
4. Ensure LCOV report generated: `ls coverage/lcov.info`

## Performance Optimization

### Caching

The pipeline uses GitHub Actions cache for:
- **npm dependencies**: Cached by `package-lock.json` hash
- **Build artifacts**: Minimal rebuild on cache hit

### Parallel Execution

Jobs run in parallel where possible:
- Lint, Build (3 platforms), Test (3 platforms), Coverage
- Only Quality Gate waits for all jobs

### Resource Usage

**Approximate run times**:
- Lint: 1-2 minutes
- Build (per platform): 2-3 minutes
- Test (per platform): 3-5 minutes
- Coverage: 3-4 minutes
- **Total**: 5-7 minutes (parallel execution)

## Security Considerations

### Secrets Management

- Never commit `CODECOV_TOKEN`
- Use GitHub Secrets for sensitive data
- Limit secret access to necessary jobs

### Dependency Security

```bash
# Audit dependencies regularly
npm audit

# Fix vulnerabilities
npm audit fix
```

### Code Security

- ESLint checks for security patterns
- TypeScript strict mode enabled
- No `eval()` or unsafe operations

## Monitoring and Alerts

### GitHub Actions

- **Status badges**: Show current pipeline status
- **Email notifications**: On workflow failures
- **Slack integration**: (optional) Configure webhooks

### Codecov

- **Coverage drops**: Alert on coverage decrease
- **PR comments**: Automatic coverage diff

## Best Practices

### For Contributors

1. ✅ Run `npm run ci` before pushing
2. ✅ Maintain 90%+ coverage on new code
3. ✅ Test on multiple platforms (if possible)
4. ✅ Write meaningful test descriptions
5. ✅ Keep tests fast and focused

### For Maintainers

1. ✅ Review coverage reports on PRs
2. ✅ Monitor CI performance trends
3. ✅ Update dependencies regularly
4. ✅ Keep CI documentation current
5. ✅ Enforce branch protection rules

## Future Enhancements

Potential improvements:

- [ ] **Release automation**: Auto-publish on version tags
- [ ] **Visual regression testing**: Screenshot comparisons
- [ ] **Benchmark tracking**: Performance regression detection
- [ ] **Dependency updates**: Automated Dependabot PRs
- [ ] **Security scanning**: SAST/DAST integration
- [ ] **E2E tests**: Full user workflow testing

## Related Documentation

- [Branch Protection Setup](.github/BRANCH_PROTECTION.md)
- [Extension Testing Guide](../vscode-extension/TESTING.md)
- [Development Workflow](../vscode-extension/README.md)
- [Coverage Configuration](../vscode-extension/.nycrc.json)

## Support

For CI/CD issues:
1. Check GitHub Actions logs
2. Review this documentation
3. Test locally with `npm run ci`
4. Open issue with reproduction steps
