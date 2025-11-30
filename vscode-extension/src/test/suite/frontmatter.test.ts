import * as assert from 'assert';
import { suite, test } from 'mocha';
import {
    TaskStatus,
    EpicStatus,
    TaskFrontmatter,
    EpicFrontmatter,
    TASK_STATUS_VALUES,
    EPIC_STATUS_VALUES,
    isTaskStatus,
    isEpicStatus
} from '../../types/frontmatter';

suite('Frontmatter Types Test Suite', () => {

    suite('TaskStatus type', () => {
        test('TASK_STATUS_VALUES should contain all valid task statuses', () => {
            assert.strictEqual(TASK_STATUS_VALUES.length, 5, 'Should have 5 status values');
            assert.ok(TASK_STATUS_VALUES.includes('open'), 'Should include open');
            assert.ok(TASK_STATUS_VALUES.includes('in_progress'), 'Should include in_progress');
            assert.ok(TASK_STATUS_VALUES.includes('blocked'), 'Should include blocked');
            assert.ok(TASK_STATUS_VALUES.includes('completed'), 'Should include completed');
            assert.ok(TASK_STATUS_VALUES.includes('cancelled'), 'Should include cancelled');
        });

        test('isTaskStatus should return true for valid statuses', () => {
            assert.strictEqual(isTaskStatus('open'), true);
            assert.strictEqual(isTaskStatus('in_progress'), true);
            assert.strictEqual(isTaskStatus('blocked'), true);
            assert.strictEqual(isTaskStatus('completed'), true);
            assert.strictEqual(isTaskStatus('cancelled'), true);
        });

        test('isTaskStatus should return false for invalid statuses', () => {
            assert.strictEqual(isTaskStatus('invalid'), false);
            assert.strictEqual(isTaskStatus('pending'), false);
            assert.strictEqual(isTaskStatus('done'), false);
            assert.strictEqual(isTaskStatus(''), false);
            assert.strictEqual(isTaskStatus(null), false);
            assert.strictEqual(isTaskStatus(undefined), false);
            assert.strictEqual(isTaskStatus(123), false);
            assert.strictEqual(isTaskStatus({}), false);
            assert.strictEqual(isTaskStatus([]), false);
        });
    });

    suite('EpicStatus type', () => {
        test('EPIC_STATUS_VALUES should contain all valid epic statuses', () => {
            assert.strictEqual(EPIC_STATUS_VALUES.length, 4, 'Should have 4 status values');
            assert.ok(EPIC_STATUS_VALUES.includes('backlog'), 'Should include backlog');
            assert.ok(EPIC_STATUS_VALUES.includes('in_progress'), 'Should include in_progress');
            assert.ok(EPIC_STATUS_VALUES.includes('completed'), 'Should include completed');
            assert.ok(EPIC_STATUS_VALUES.includes('cancelled'), 'Should include cancelled');
        });

        test('isEpicStatus should return true for valid statuses', () => {
            assert.strictEqual(isEpicStatus('backlog'), true);
            assert.strictEqual(isEpicStatus('in_progress'), true);
            assert.strictEqual(isEpicStatus('completed'), true);
            assert.strictEqual(isEpicStatus('cancelled'), true);
        });

        test('isEpicStatus should return false for invalid statuses', () => {
            assert.strictEqual(isEpicStatus('invalid'), false);
            assert.strictEqual(isEpicStatus('open'), false);  // open is TaskStatus, not EpicStatus
            assert.strictEqual(isEpicStatus('blocked'), false);  // blocked is TaskStatus, not EpicStatus
            assert.strictEqual(isEpicStatus(''), false);
            assert.strictEqual(isEpicStatus(null), false);
            assert.strictEqual(isEpicStatus(undefined), false);
            assert.strictEqual(isEpicStatus(123), false);
            assert.strictEqual(isEpicStatus({}), false);
        });
    });

    suite('TaskFrontmatter interface', () => {
        test('should allow creation of valid TaskFrontmatter object', () => {
            const taskFrontmatter: TaskFrontmatter = {
                name: 'Initialize extension project with TypeScript + webpack config',
                status: 'open',
                created: '2025-10-04T12:22:30Z',
                updated: '2025-10-04T12:39:29Z',
                github: 'https://github.com/johnproblems/formaltask/issues/2',
                depends_on: [],
                parallel: true,
                conflicts_with: []
            };

            assert.strictEqual(taskFrontmatter.name, 'Initialize extension project with TypeScript + webpack config');
            assert.strictEqual(taskFrontmatter.status, 'open');
            assert.strictEqual(taskFrontmatter.created, '2025-10-04T12:22:30Z');
            assert.strictEqual(taskFrontmatter.updated, '2025-10-04T12:39:29Z');
            assert.strictEqual(taskFrontmatter.github, 'https://github.com/johnproblems/formaltask/issues/2');
            assert.deepStrictEqual(taskFrontmatter.depends_on, []);
            assert.strictEqual(taskFrontmatter.parallel, true);
            assert.deepStrictEqual(taskFrontmatter.conflicts_with, []);
        });

        test('should allow depends_on with string references', () => {
            const taskFrontmatter: TaskFrontmatter = {
                name: 'Configure testing infrastructure',
                status: 'open',
                created: '2025-10-04T12:22:30Z',
                updated: '2025-10-04T12:39:29Z',
                github: 'https://github.com/johnproblems/formaltask/issues/3',
                depends_on: ['Task 2.md'],
                parallel: false,
                conflicts_with: []
            };

            assert.deepStrictEqual(taskFrontmatter.depends_on, ['Task 2.md']);
        });

        test('should allow depends_on with numeric IDs', () => {
            const taskFrontmatter: TaskFrontmatter = {
                name: 'Create Epic data provider service',
                status: 'open',
                created: '2025-10-04T12:22:30Z',
                updated: '2025-10-04T12:39:29Z',
                github: 'https://github.com/johnproblems/formaltask/issues/10',
                depends_on: [8],
                parallel: false,
                conflicts_with: []
            };

            assert.deepStrictEqual(taskFrontmatter.depends_on, [8]);
        });

        test('should allow mixed depends_on values', () => {
            const taskFrontmatter: TaskFrontmatter = {
                name: 'Mixed dependencies task',
                status: 'in_progress',
                created: '2025-10-04T12:22:30Z',
                updated: '2025-10-04T12:39:29Z',
                github: 'https://github.com/johnproblems/formaltask/issues/15',
                depends_on: [2, 'Task 3.md', 4],
                parallel: true,
                conflicts_with: [5, 'Task 6.md']
            };

            assert.deepStrictEqual(taskFrontmatter.depends_on, [2, 'Task 3.md', 4]);
            assert.deepStrictEqual(taskFrontmatter.conflicts_with, [5, 'Task 6.md']);
        });

        test('should allow all valid task statuses', () => {
            const statuses: TaskStatus[] = ['open', 'in_progress', 'blocked', 'completed', 'cancelled'];
            
            for (const status of statuses) {
                const taskFrontmatter: TaskFrontmatter = {
                    name: `Task with status ${status}`,
                    status: status,
                    created: '2025-10-04T12:22:30Z',
                    updated: '2025-10-04T12:39:29Z',
                    github: 'https://github.com/johnproblems/formaltask/issues/1',
                    depends_on: [],
                    parallel: true,
                    conflicts_with: []
                };

                assert.strictEqual(taskFrontmatter.status, status);
            }
        });
    });

    suite('EpicFrontmatter interface', () => {
        test('should allow creation of valid EpicFrontmatter object', () => {
            const epicFrontmatter: EpicFrontmatter = {
                name: 'vscode-extension',
                status: 'backlog',
                created: '2025-10-04T12:11:36Z',
                progress: '0%',
                prd: '.claude/prds/vscode-extension.md',
                github: 'https://github.com/johnproblems/formaltask/issues/1'
            };

            assert.strictEqual(epicFrontmatter.name, 'vscode-extension');
            assert.strictEqual(epicFrontmatter.status, 'backlog');
            assert.strictEqual(epicFrontmatter.created, '2025-10-04T12:11:36Z');
            assert.strictEqual(epicFrontmatter.progress, '0%');
            assert.strictEqual(epicFrontmatter.prd, '.claude/prds/vscode-extension.md');
            assert.strictEqual(epicFrontmatter.github, 'https://github.com/johnproblems/formaltask/issues/1');
        });

        test('should allow all valid epic statuses', () => {
            const statuses: EpicStatus[] = ['backlog', 'in_progress', 'completed', 'cancelled'];
            
            for (const status of statuses) {
                const epicFrontmatter: EpicFrontmatter = {
                    name: `Epic with status ${status}`,
                    status: status,
                    created: '2025-10-04T12:11:36Z',
                    progress: '50%',
                    prd: '.claude/prds/test.md',
                    github: 'https://github.com/johnproblems/formaltask/issues/1'
                };

                assert.strictEqual(epicFrontmatter.status, status);
            }
        });

        test('should handle various progress percentage formats', () => {
            const progressValues = ['0%', '25%', '50%', '75%', '100%'];
            
            for (const progress of progressValues) {
                const epicFrontmatter: EpicFrontmatter = {
                    name: 'test-epic',
                    status: 'in_progress',
                    created: '2025-10-04T12:11:36Z',
                    progress: progress,
                    prd: '.claude/prds/test.md',
                    github: 'https://github.com/johnproblems/formaltask/issues/1'
                };

                assert.strictEqual(epicFrontmatter.progress, progress);
            }
        });
    });
});
