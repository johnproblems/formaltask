import * as path from 'path';
import Mocha from 'mocha';
import { glob } from 'glob';

export async function run(): Promise<void> {
	// Create the mocha test
	const mocha = new Mocha({
		ui: 'bdd',
		color: true,
		timeout: 20000
	});

	const testsRoot = path.resolve(__dirname, '.');

	// Find all test files
	const files = await glob('**.test.js', { cwd: testsRoot });

	// Add files to the test suite
	files.forEach(f => mocha.addFile(path.resolve(testsRoot, f)));

	// Run the tests
	return new Promise<void>((resolve, reject) => {
		try {
			mocha.run((failures: number) => {
				if (failures > 0) {
					reject(new Error(`${failures} tests failed.`));
				} else {
					resolve();
				}
			});
		} catch (err) {
			console.error('Error running tests:', err);
			reject(err);
		}
	});
}
