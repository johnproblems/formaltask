import * as vscode from 'vscode';

/**
 * This method is called when the extension is activated.
 * The extension is activated the very first time the command is executed.
 */
export function activate(_context: vscode.ExtensionContext): void {
	// Register commands here
	// Example:
	// const disposable = vscode.commands.registerCommand('ccpm.helloWorld', () => {
	//     vscode.window.showInformationMessage('Hello World from CCPM!');
	// });
	// _context.subscriptions.push(disposable);
}

/**
 * This method is called when the extension is deactivated.
 */
export function deactivate(): void {
	// Cleanup resources if needed
}
