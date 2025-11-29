# CCPM Monitor - VSCode Extension

[![CI/CD Pipeline](https://github.com/johnproblems/formaltask/actions/workflows/ci.yml/badge.svg)](https://github.com/johnproblems/formaltask/actions/workflows/ci.yml)
[![codecov](https://codecov.io/gh/johnproblems/formaltask/branch/enhancements/graph/badge.svg)](https://codecov.io/gh/johnproblems/formaltask)
[![Code Coverage](https://img.shields.io/badge/coverage-90%25+-brightgreen.svg)](https://github.com/johnproblems/formaltask/actions)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](../LICENSE)

## Status: Designed, Not Yet Implemented

The VSCode extension has been fully designed and architected but is not yet implemented.

See the complete design in: `../.claude/docs/VSCODE_EXTENSION_DESIGN.md`

## Implementation

To implement:

1. Set up TypeScript project:
   ```bash
   npm init -y
   npm install --save-dev @types/vscode @types/node typescript
   ```

2. Create `package.json` based on design document

3. Implement features from design:
   - Epic/Task Tree Provider
   - Progress Notes Panel
   - Status Bar Integration
   - Commands
   - Hover tooltips

4. Test in Extension Development Host (F5)

5. Package and publish:
   ```bash
   vsce package
   ```

## CI/CD Pipeline

This extension uses a robust CI/CD pipeline with:

- **Multi-platform testing**: Linux, macOS, and Windows
- **Code coverage enforcement**: 90%+ minimum threshold
- **Automated quality gates**: Linting, building, testing, and coverage checks
- **Coverage reporting**: Integrated with Codecov for detailed coverage tracking
- **Build artifacts**: Automatically generated and validated

### Running Tests Locally

```bash
# Run all tests with coverage
npm run test:coverage

# Check coverage thresholds (90%+)
npm run coverage:check

# Run full CI pipeline locally
npm run ci
```

### Coverage Requirements

The CI pipeline enforces strict coverage requirements:
- **Lines**: 90%+
- **Statements**: 90%+
- **Functions**: 90%+
- **Branches**: 90%+

Pull requests that don't meet these thresholds will fail the quality gate.

## Design

See: `../.claude/docs/VSCODE_EXTENSION_DESIGN.md`

All TypeScript interfaces, classes, and implementation details are documented there.
