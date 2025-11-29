# CI/CD Pipeline Quick Reference

## Status Badges

```markdown
[![CI/CD Pipeline](https://github.com/johnproblems/formaltask/actions/workflows/ci.yml/badge.svg)](https://github.com/johnproblems/formaltask/actions/workflows/ci.yml)
[![codecov](https://codecov.io/gh/johnproblems/formaltask/branch/enhancements/graph/badge.svg)](https://codecov.io/gh/johnproblems/formaltask)
[![Code Coverage](https://img.shields.io/badge/coverage-90%25+-brightgreen.svg)](https://github.com/johnproblems/formaltask/actions)
```

## Essential Commands

### Before Committing
```bash
npm run lint              # Check code style
npm run ci               # Run full CI pipeline locally
```

### Testing & Coverage
```bash
npm run test:unit         # Unit tests only
npm test                 # Integration tests (with VS Code)
npm run test:coverage    # Tests with coverage report
npm run coverage:check   # Verify 90%+ threshold
npm run coverage:report  # Generate HTML report
```

### Building
```bash
npm run compile          # Development build
npm run package          # Production build
npm run ci:build         # CI-optimized build
```

## Coverage Requirements

| Metric      | Threshold | Status |
|-------------|-----------|--------|
| Lines       | ≥90%      | ✅ Enforced |
| Statements  | ≥90%      | ✅ Enforced |
| Functions   | ≥90%      | ✅ Enforced |
| Branches    | ≥90%      | ✅ Enforced |

## Pipeline Jobs

```
┌─────────────────────────────────────────┐
│           CI/CD PIPELINE                │
└─────────────────────────────────────────┘
                 │
    ┌────────────┼────────────┬──────────┐
    │            │            │          │
    ▼            ▼            ▼          ▼
┌───────┐   ┌────────┐   ┌───────┐  ┌──────────┐
│ Lint  │   │ Build  │   │ Test  │  │ Coverage │
│       │   │ Matrix │   │ Matrix│  │  Check   │
└───────┘   └────────┘   └───────┘  └──────────┘
    │            │            │          │
    └────────────┼────────────┴──────────┘
                 │
                 ▼
          ┌─────────────┐
          │ Quality Gate│
          │   (90%+)    │
          └─────────────┘
```

## Platform Matrix

| Platform         | Build | Test |
|------------------|-------|------|
| ubuntu-latest    | ✅    | ✅   |
| macos-latest     | ✅    | ✅   |
| windows-latest   | ✅    | ✅   |

## Workflow Triggers

- ✅ Push to `main`, `enhancements`, `develop`
- ✅ Pull requests to protected branches
- ✅ Manual trigger (workflow_dispatch)
- ⚠️ Only when `vscode-extension/**` changes

## Codecov Setup

### 1. Enable Repository
```
https://codecov.io → Sign in → Enable formaltask
```

### 2. Add Token to GitHub
```
Settings → Secrets → Actions → New secret
Name: CODECOV_TOKEN
Value: <token from Codecov>
```

## Branch Protection

### Required Status Checks
- ✅ Lint
- ✅ Build on ubuntu-latest
- ✅ Build on macos-latest  
- ✅ Build on windows-latest
- ✅ Test on ubuntu-latest
- ✅ Test on macos-latest
- ✅ Test on windows-latest
- ✅ Code Coverage Enforcement
- ✅ Quality Gate

### Setup Steps
```
Repository → Settings → Branches → Add rule
Branch: main (or enhancements, develop)
☑ Require pull request reviews
☑ Require status checks to pass
☑ Require conversation resolution
☐ Allow bypass (DO NOT CHECK)
```

## Troubleshooting

### Coverage Failing
```bash
# 1. Check current coverage
npm run test:coverage

# 2. View detailed report
npm run coverage:report
open coverage/index.html

# 3. Find uncovered code and add tests

# 4. Verify improvement
npm run coverage:check
```

### Build Failing
```bash
# 1. Clean rebuild
rm -rf node_modules dist out coverage
npm ci
npm run compile

# 2. Check for errors
npm run lint
npm run ci:build
```

### Tests Failing in CI
```bash
# 1. Run locally in CI mode
npm run pretest
npm test

# 2. Check VS Code version
code --version

# 3. Review test logs in Actions tab
```

## File Structure

```
.github/
├── workflows/
│   └── ci.yml                    # Main CI/CD workflow
├── CI_CD.md                      # Comprehensive docs
└── BRANCH_PROTECTION.md          # Protection setup guide

vscode-extension/
├── .nycrc.json                   # Coverage config (90%+)
├── package.json                  # Scripts and dependencies
├── tsconfig.json                 # TypeScript config
└── README.md                     # User documentation
```

## Key Files Modified

- ✅ `.github/workflows/ci.yml` - CI/CD pipeline
- ✅ `vscode-extension/.nycrc.json` - 90% thresholds
- ✅ `vscode-extension/package.json` - CI scripts
- ✅ `vscode-extension/README.md` - Badges and docs

## Documentation

| Document | Purpose |
|----------|---------|
| `.github/CI_CD.md` | Complete pipeline documentation |
| `.github/BRANCH_PROTECTION.md` | GitHub branch protection setup |
| `.github/QUICK_REFERENCE.md` | This quick reference |
| `vscode-extension/README.md` | Extension documentation |
| `vscode-extension/TESTING.md` | Testing infrastructure guide |

## Next Steps

1. ✅ **Push changes** to trigger first CI run
2. ⬜ **Configure Codecov** (add token to secrets)
3. ⬜ **Set up branch protection** (follow BRANCH_PROTECTION.md)
4. ⬜ **Verify pipeline** passes on test PR
5. ⬜ **Monitor coverage** trends over time

## Support

- 📚 [Full CI/CD Documentation](.github/CI_CD.md)
- 🔒 [Branch Protection Guide](.github/BRANCH_PROTECTION.md)
- 🧪 [Testing Guide](../vscode-extension/TESTING.md)
- 🐛 [GitHub Issues](https://github.com/johnproblems/formaltask/issues)

---

**Last Updated**: November 29, 2025
**Pipeline Version**: 1.0.0
**Coverage Threshold**: 90%+
