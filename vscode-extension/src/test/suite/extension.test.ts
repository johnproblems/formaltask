import * as assert from 'assert';
import * as vscode from 'vscode';
import * as sinon from 'sinon';
import { suite, test, suiteSetup, suiteTeardown } from 'mocha';
import { activate, deactivate } from '../../extension';
import { createMockContext, createSandbox } from '../helpers/testUtils';

suite('Extension Test Suite', () => {
	let sandbox: sinon.SinonSandbox;

	suiteSetup(() => {
		sandbox = createSandbox();
	});

	suiteTeardown(() => {
		sandbox.restore();
	});

	test('Extension should be present', () => {
		const extension = vscode.extensions.getExtension('undefined_publisher.ccpm-vscode-extension');
		assert.ok(extension !== undefined, 'Extension should be available');
	});

	test('Should activate extension', () => {
		const mockContext = createMockContext();

		// Just test that activate runs without throwing
		assert.doesNotThrow(() => {
			activate(mockContext);
		}, 'activate should not throw');
	});

	test('Should deactivate extension', () => {
		// Just test that deactivate runs without throwing
		assert.doesNotThrow(() => {
			deactivate();
		}, 'deactivate should not throw');
	});

	test('Mock context should have correct structure', () => {
		const mockContext = createMockContext();

		assert.ok(mockContext.subscriptions, 'Context should have subscriptions');
		assert.ok(mockContext.extensionPath, 'Context should have extensionPath');
		assert.ok(mockContext.extensionUri, 'Context should have extensionUri');
		assert.strictEqual(mockContext.extensionMode, vscode.ExtensionMode.Test);
		assert.ok(mockContext.workspaceState, 'Context should have workspaceState');
		assert.ok(mockContext.globalState, 'Context should have globalState');
		assert.ok(mockContext.secrets, 'Context should have secrets');
	});

	test('Mock memento should store and retrieve values', async () => {
		const mockContext = createMockContext();
		
		await mockContext.workspaceState.update('testKey', 'testValue');
		const value = mockContext.workspaceState.get<string>('testKey');

		assert.strictEqual(value, 'testValue', 'Should retrieve stored value');
	});

	test('Mock memento should return default value when key does not exist', () => {
		const mockContext = createMockContext();
		
		const value = mockContext.workspaceState.get('nonExistentKey', 'defaultValue');

		assert.strictEqual(value, 'defaultValue', 'Should return default value');
	});

	test('Mock memento should list all keys', async () => {
		const mockContext = createMockContext();
		
		await mockContext.workspaceState.update('key1', 'value1');
		await mockContext.workspaceState.update('key2', 'value2');
		
		const keys = mockContext.workspaceState.keys();

		assert.strictEqual(keys.length, 2, 'Should have 2 keys');
		assert.ok(keys.includes('key1'), 'Should include key1');
		assert.ok(keys.includes('key2'), 'Should include key2');
	});

	test('Mock secret storage should store and retrieve secrets', async () => {
		const mockContext = createMockContext();
		
		await mockContext.secrets.store('secretKey', 'secretValue');
		const secret = await mockContext.secrets.get('secretKey');

		assert.strictEqual(secret, 'secretValue', 'Should retrieve stored secret');
	});

	test('Mock secret storage should delete secrets', async () => {
		const mockContext = createMockContext();
		
		await mockContext.secrets.store('secretKey', 'secretValue');
		await mockContext.secrets.delete('secretKey');
		const secret = await mockContext.secrets.get('secretKey');

		assert.strictEqual(secret, undefined, 'Secret should be deleted');
	});

	test('Sinon stub should work correctly', () => {
		const stub = sandbox.stub();
		stub.returns(42);

		// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
		const result = stub();

		assert.strictEqual(result, 42, 'Stub should return stubbed value');
		assert.ok(stub.calledOnce, 'Stub should be called once');
	});

	test('Sinon spy should track calls', () => {
		const spy = sandbox.spy();
		
		spy('arg1', 'arg2');
		spy('arg3');

		assert.ok(spy.calledTwice, 'Spy should be called twice');
		assert.ok(spy.firstCall.calledWith('arg1', 'arg2'), 'First call should have correct args');
		assert.ok(spy.secondCall.calledWith('arg3'), 'Second call should have correct args');
	});
});
