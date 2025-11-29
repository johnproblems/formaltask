import * as sinon from 'sinon';
import * as vscode from 'vscode';

/**
 * Helper utilities for testing VSCode extensions
 */

/**
 * Create a mock VSCode ExtensionContext
 */
export function createMockContext(): vscode.ExtensionContext {
	const subscriptions: vscode.Disposable[] = [];
	
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	return {
		subscriptions,
		extensionPath: '/mock/extension/path',
		extensionUri: vscode.Uri.file('/mock/extension/path'),
		extensionMode: vscode.ExtensionMode.Test,
		asAbsolutePath: (relativePath: string) => `/mock/extension/path/${relativePath}`,
		storageUri: vscode.Uri.file('/mock/storage'),
		globalStorageUri: vscode.Uri.file('/mock/global-storage'),
		logUri: vscode.Uri.file('/mock/logs'),
		storagePath: '/mock/storage',
		globalStoragePath: '/mock/global-storage',
		logPath: '/mock/logs',
		workspaceState: createMockMemento(),
		globalState: createMockMemento(),
		secrets: createMockSecretStorage(),
		environmentVariableCollection: createMockEnvironmentVariableCollection(),
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		extension: {} as vscode.Extension<any>,
		languageModelAccessInformation: createMockLanguageModelAccessInformation()
	};
}

/**
 * Create a mock Memento for state management
 */
function createMockMemento(): vscode.Memento & { setKeysForSync(keys: readonly string[]): void } {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const storage = new Map<string, any>();
	
	return {
		get: <T>(key: string, defaultValue?: T): T | undefined => {
			// eslint-disable-next-line @typescript-eslint/no-unsafe-return
			return storage.get(key) ?? defaultValue;
		},
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		update: (key: string, value: any): Thenable<void> => {
			storage.set(key, value);
			return Promise.resolve();
		},
		keys: (): readonly string[] => {
			return Array.from(storage.keys());
		},
		setKeysForSync: (_keys: readonly string[]): void => {
			// Mock implementation
		}
	};
}

/**
 * Create a mock SecretStorage
 */
function createMockSecretStorage(): vscode.SecretStorage {
	const storage = new Map<string, string>();
	const onDidChangeEmitter = new vscode.EventEmitter<vscode.SecretStorageChangeEvent>();
	
	return {
		get: (key: string): Thenable<string | undefined> => {
			return Promise.resolve(storage.get(key));
		},
		store: (key: string, value: string): Thenable<void> => {
			storage.set(key, value);
			onDidChangeEmitter.fire({ key });
			return Promise.resolve();
		},
		delete: (key: string): Thenable<void> => {
			storage.delete(key);
			onDidChangeEmitter.fire({ key });
			return Promise.resolve();
		},
		keys: (): Thenable<string[]> => {
			return Promise.resolve(Array.from(storage.keys()));
		},
		onDidChange: onDidChangeEmitter.event
	};
}

/**
 * Create a mock EnvironmentVariableCollection
 */
function createMockEnvironmentVariableCollection(): vscode.GlobalEnvironmentVariableCollection {
	const storage = new Map<string, vscode.EnvironmentVariableMutator>();
	
	const collection: vscode.GlobalEnvironmentVariableCollection = {
		persistent: true,
		description: 'Mock Environment Variables',
		replace: (variable: string, value: string, options?: vscode.EnvironmentVariableMutatorOptions): void => {
			storage.set(variable, {
				type: vscode.EnvironmentVariableMutatorType.Replace,
				value,
				options: options || {}
			});
		},
		append: (variable: string, value: string, options?: vscode.EnvironmentVariableMutatorOptions): void => {
			storage.set(variable, {
				type: vscode.EnvironmentVariableMutatorType.Append,
				value,
				options: options || {}
			});
		},
		prepend: (variable: string, value: string, options?: vscode.EnvironmentVariableMutatorOptions): void => {
			storage.set(variable, {
				type: vscode.EnvironmentVariableMutatorType.Prepend,
				value,
				options: options || {}
			});
		},
		get: (variable: string): vscode.EnvironmentVariableMutator | undefined => {
			return storage.get(variable);
		},
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		forEach: (callback: (variable: string, mutator: vscode.EnvironmentVariableMutator, collection: vscode.GlobalEnvironmentVariableCollection) => any, _thisArg?: any): void => {
			storage.forEach((mutator, variable) => {
				callback(variable, mutator, collection);
			});
		},
		delete: (variable: string): void => {
			storage.delete(variable);
		},
		clear: (): void => {
			storage.clear();
		},
		getScoped: (_scope: vscode.EnvironmentVariableScope): vscode.EnvironmentVariableCollection => {
			// Return the same collection for simplicity in tests
			return collection;
		},
		[Symbol.iterator]: function* () {
			for (const [variable, mutator] of storage) {
				yield [variable, mutator] as [string, vscode.EnvironmentVariableMutator];
			}
		}
	};
	
	return collection;
}

/**
 * Create a mock LanguageModelAccessInformation
 */
function createMockLanguageModelAccessInformation(): vscode.LanguageModelAccessInformation {
	const onDidChangeEmitter = new vscode.EventEmitter<void>();
	
	return {
		onDidChange: onDidChangeEmitter.event,
		canSendRequest: (_chat: vscode.LanguageModelChat): boolean | undefined => {
			return true;
		}
	};
}

/**
 * Create a Sinon sandbox for easy cleanup
 */
export function createSandbox(): sinon.SinonSandbox {
	return sinon.createSandbox();
}

/**
 * Wait for a specific amount of time
 */
export function wait(ms: number): Promise<void> {
	return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Spy on console methods to capture output
 */
export function spyOnConsole(sandbox: sinon.SinonSandbox): {
	log: sinon.SinonSpy;
	error: sinon.SinonSpy;
	warn: sinon.SinonSpy;
} {
	return {
		log: sandbox.spy(console, 'log'),
		error: sandbox.spy(console, 'error'),
		warn: sandbox.spy(console, 'warn')
	};
}
