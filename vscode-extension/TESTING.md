# Testing Infrastructure

## Overview

This VSCode extension uses a comprehensive testing infrastructure with the following tools:

- **Mocha**: Test framework for running tests
- **Sinon**: Mocking, stubbing, and spying library
- **nyc (Istanbul)**: Code coverage reporting tool
- **@vscode/test-electron**: VSCode extension testing runner

## Directory Structure

```
vscode-extension/
├── src/
│   ├── extension.ts          # Main extension code
│   └── test/
│       ├── runTest.ts         # Test runner entry point
│       ├── helpers/
│       │   └── testUtils.ts   # Test helper utilities
│       └── suite/
│           ├── index.ts       # Mocha test suite setup
│           └── extension.test.ts  # Sample tests
├── .mocharc.json              # Mocha configuration
├── .nycrc.json                # nyc coverage configuration
└── package.json               # Dependencies and scripts
```

## Configuration Files

### `.mocharc.json`
Configures Mocha with:
- TypeScript support via source-map-support
- BDD UI style for describe/it syntax
- 20-second timeout for VSCode extension tests
- Test file pattern: `out/test/suite/**/*.test.js`

### `.nycrc.json`
Configures code coverage with:
- **Reporters**: HTML, LCOV, text, text-summary
- **Coverage thresholds**:
  - Lines: 80%
  - Statements: 80%
  - Functions: 80%
  - Branches: 70%
- **Output directory**: `coverage/`
- Source map support enabled

## Available Scripts

### Test Scripts

```bash
# Run full integration tests (requires GUI environment)
npm test

# Compile test files only
npm run compile-tests

# Watch mode for test compilation
npm run watch-tests

# Run linting
npm run lint
```

### Coverage Scripts (Note: VSCode tests require special runner)

The standard coverage scripts are configured but need to be run through the VSCode test runner:

```bash
npm run test:coverage     # Run tests with coverage
npm run coverage          # Alias for test:coverage
npm run coverage:report   # Generate HTML coverage report
```

## Test Helper Utilities

The `src/test/helpers/testUtils.ts` file provides:

### `createMockContext()`
Creates a mock VSCode ExtensionContext with:
- Subscriptions array
- Extension paths and URIs
- Workspace state (Memento)
- Global state (Memento)
- Secret storage
- Environment variable collection

### `createSandbox()`
Creates a Sinon sandbox for easy cleanup of stubs, spies, and mocks.

### `spyOnConsole(sandbox)`
Spies on console methods (log, error, warn) to capture output in tests.

### `wait(ms)`
Promise-based delay utility for async tests.

## Sample Tests

The `src/test/suite/extension.test.ts` file demonstrates:

1. **Extension activation tests**
   - Verifying extension is present
   - Testing activate() function
   - Testing deactivate() function

2. **Mock context tests**
   - Verifying mock context structure
   - Testing Memento storage and retrieval
   - Testing secret storage operations

3. **Sinon tests**
   - Using stubs
   - Using spies
   - Verifying call counts and arguments

## Writing Tests

### Basic Test Structure

```typescript
import * as assert from 'assert';
import * as sinon from 'sinon';
import { createMockContext, createSandbox } from '../helpers/testUtils';

suite('My Feature', () => {
    let sandbox: sinon.SinonSandbox;

    setup(() => {
        sandbox = createSandbox();
    });

    teardown(() => {
        sandbox.restore();
    });

    test('Should do something', () => {
        const mockContext = createMockContext();
        // Your test code here
        assert.ok(true);
    });
});
```

### Using Mocks

```typescript
test('Should call VSCode API', () => {
    const stub = sandbox.stub(vscode.window, 'showInformationMessage');
    stub.resolves('OK');

    // Call code that uses vscode.window.showInformationMessage
    
    assert.ok(stub.calledOnce);
});
```

### Testing Async Code

```typescript
test('Should handle async operations', async () => {
    const mockContext = createMockContext();
    
    await mockContext.workspaceState.update('key', 'value');
    const value = mockContext.workspaceState.get('key');
    
    assert.strictEqual(value, 'value');
});
```

## Running Tests in Development

Since VSCode extension tests need to run in the VSCode environment:

1. **Via VSCode Test Runner** (Recommended for development):
   - Open the extension in VSCode
   - Press F5 or use "Run Extension" from the Debug view
   - The tests will run in the Extension Development Host

2. **Via Command Line** (Requires GUI environment):
   ```bash
   npm test
   ```
   This downloads a VSCode instance and runs tests in it.

3. **In CI/CD** (Headless):
   Use Xvfb on Linux or similar for headless testing:
   ```bash
   xvfb-run -a npm test
   ```

## Coverage Reports

After running tests with coverage:

```bash
npm run coverage
```

Coverage reports are generated in:
- `coverage/index.html` - Interactive HTML report
- `coverage/lcov.info` - LCOV format for CI tools
- Console output - Text summary

Open the HTML report:
```bash
open coverage/index.html  # macOS
xdg-open coverage/index.html  # Linux
```

## Continuous Integration

For CI environments (GitHub Actions, etc.):

1. Install dependencies:
   ```bash
   npm ci
   ```

2. Run linting:
   ```bash
   npm run lint
   ```

3. Compile code:
   ```bash
   npm run compile
   npm run compile-tests
   ```

4. Run tests (with Xvfb on Linux):
   ```bash
   xvfb-run -a npm test
   ```

5. Check coverage reports in `coverage/` directory

## Troubleshooting

### "Cannot find module 'vscode'" Error

This is expected when running Mocha directly. VSCode extension tests must run through the VSCode test runner (`npm test`), not standalone Mocha.

### Tests Fail with "libatk-1.0.so.0" Error

Running in a headless environment without GUI libraries. Use `xvfb-run`:
```bash
xvfb-run -a npm test
```

### TypeScript Compilation Errors

Ensure you're compiling tests before running:
```bash
npm run compile-tests
```

### Coverage Thresholds Not Met

Adjust thresholds in `.nycrc.json` or write more tests to increase coverage.

## Best Practices

1. **Always use sandbox**: Create a Sinon sandbox in `setup()` and restore in `teardown()`

2. **Mock VSCode APIs**: Use Sinon stubs to mock VSCode APIs rather than calling them directly

3. **Test isolation**: Each test should be independent and not rely on state from other tests

4. **Descriptive names**: Use clear, descriptive test names that explain what is being tested

5. **Arrange-Act-Assert**: Structure tests with clear setup, execution, and verification phases

6. **Async handling**: Always use `async/await` for asynchronous operations

7. **Clean up**: Use `teardown()` to restore stubs and clean up resources

## Dependencies

### Production Dependencies
- None (extension has no runtime dependencies)

### Development Dependencies
- `@vscode/test-electron`: ^2.3.8 - VSCode test runner
- `mocha`: Latest - Test framework
- `@types/mocha`: Latest - TypeScript types for Mocha
- `sinon`: Latest - Mocking and stubbing
- `@types/sinon`: Latest - TypeScript types for Sinon
- `nyc`: Latest - Code coverage
- `@istanbuljs/nyc-config-typescript`: Latest - nyc TypeScript preset
- `source-map-support`: Latest - Source map support for coverage
- `glob`: Latest - File pattern matching for test discovery

## Future Enhancements

- Add integration tests for command registration
- Add tests for configuration management
- Add tests for file system operations
- Set up automated CI/CD pipeline
- Add performance benchmarks
- Add E2E tests for user workflows
