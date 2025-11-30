/**
 * TypeScript interfaces for Epic and Task frontmatter.
 * These types represent the YAML frontmatter structure used in .claude/epics/ files.
 * @module types/frontmatter
 */

/**
 * Status values for Tasks.
 * - 'open': Task is pending and ready to be started
 * - 'in_progress': Task is currently being worked on
 * - 'blocked': Task is blocked by dependencies or other issues
 * - 'completed': Task has been successfully finished
 * - 'cancelled': Task has been cancelled and will not be completed
 */
export type TaskStatus = 'open' | 'in_progress' | 'blocked' | 'completed' | 'cancelled';

/**
 * Status values for Epics.
 * - 'backlog': Epic is planned but not yet started
 * - 'in_progress': Epic has active tasks being worked on
 * - 'completed': All tasks in the epic are completed
 * - 'cancelled': Epic has been cancelled
 */
export type EpicStatus = 'backlog' | 'in_progress' | 'completed' | 'cancelled';

/**
 * ISO 8601 date string type alias.
 * Format: YYYY-MM-DDTHH:mm:ssZ (e.g., "2025-10-04T12:22:30Z")
 */
export type ISODateString = string;

/**
 * GitHub URL type alias for issue/PR links.
 * Format: https://github.com/{owner}/{repo}/issues/{number}
 */
export type GitHubURL = string;

/**
 * Progress percentage as a string (e.g., "75%").
 */
export type ProgressPercentage = string;

/**
 * Frontmatter for a Task file (.md files in epic directories).
 * Tasks represent individual work items within an Epic.
 *
 * @example
 * ```yaml
 * ---
 * name: Initialize extension project with TypeScript + webpack config
 * status: open
 * created: 2025-10-04T12:22:30Z
 * updated: 2025-10-04T12:39:29Z
 * github: https://github.com/johnproblems/formaltask/issues/2
 * depends_on: []
 * parallel: true
 * conflicts_with: []
 * ---
 * ```
 */
export interface TaskFrontmatter {
    /**
     * Short name/title of the task.
     */
    name: string;

    /**
     * Current status of the task.
     */
    status: TaskStatus;

    /**
     * ISO 8601 timestamp when the task was created.
     */
    created: ISODateString;

    /**
     * ISO 8601 timestamp when the task was last updated.
     */
    updated: ISODateString;

    /**
     * Full GitHub issue URL for this task.
     */
    github: GitHubURL;

    /**
     * Array of task IDs or references that this task depends on.
     * Can be task numbers (e.g., [2, 3]) or task file references (e.g., ["Task 2.md"]).
     */
    depends_on: (string | number)[];

    /**
     * Whether this task can be worked on in parallel with other tasks.
     */
    parallel: boolean;

    /**
     * Array of task IDs that this task conflicts with.
     * Tasks that conflict cannot be worked on simultaneously.
     */
    conflicts_with: (string | number)[];
}

/**
 * Frontmatter for an Epic file (epic.md).
 * Epics are collections of related tasks grouped in a directory.
 *
 * @example
 * ```yaml
 * ---
 * name: vscode-extension
 * status: backlog
 * created: 2025-10-04T12:11:36Z
 * progress: 0%
 * prd: .claude/prds/vscode-extension.md
 * github: https://github.com/johnproblems/formaltask/issues/1
 * ---
 * ```
 */
export interface EpicFrontmatter {
    /**
     * Short name/identifier for the epic.
     * Typically matches the directory name.
     */
    name: string;

    /**
     * Current status of the epic.
     */
    status: EpicStatus;

    /**
     * ISO 8601 timestamp when the epic was created.
     */
    created: ISODateString;

    /**
     * Progress percentage as a string (e.g., "75%").
     * Calculated based on completed tasks vs total tasks.
     */
    progress: ProgressPercentage;

    /**
     * Path to the Product Requirements Document for this epic.
     * Relative path from the repository root.
     */
    prd: string;

    /**
     * Full GitHub issue URL for this epic.
     */
    github: GitHubURL;
}

/**
 * Extended TaskFrontmatter with optional fields that may be present in some tasks.
 * Use this when parsing task files where some fields might be missing.
 */
export interface ParsedTaskFrontmatter {
    /**
     * Short name/title of the task.
     */
    name: string;

    /**
     * Current status of the task.
     */
    status: TaskStatus;

    /**
     * ISO 8601 timestamp when the task was created.
     */
    created: ISODateString;

    /**
     * ISO 8601 timestamp when the task was last updated.
     */
    updated?: ISODateString;

    /**
     * Full GitHub issue URL for this task.
     */
    github?: GitHubURL;

    /**
     * Array of task IDs or references that this task depends on.
     */
    depends_on?: (string | number)[];

    /**
     * Whether this task can be worked on in parallel with other tasks.
     */
    parallel?: boolean;

    /**
     * Array of task IDs that this task conflicts with.
     */
    conflicts_with?: (string | number)[];
}

/**
 * Extended EpicFrontmatter with optional fields that may be present in some epics.
 * Use this when parsing epic files where some fields might be missing.
 */
export interface ParsedEpicFrontmatter {
    /**
     * Short name/identifier for the epic.
     */
    name: string;

    /**
     * Current status of the epic.
     */
    status: EpicStatus;

    /**
     * ISO 8601 timestamp when the epic was created.
     */
    created: ISODateString;

    /**
     * Progress percentage as a string.
     */
    progress?: ProgressPercentage;

    /**
     * Path to the Product Requirements Document for this epic.
     */
    prd?: string;

    /**
     * Full GitHub issue URL for this epic.
     */
    github?: GitHubURL;
}

/**
 * Array of valid TaskStatus values for runtime validation.
 */
export const TASK_STATUS_VALUES: readonly TaskStatus[] = [
    'open',
    'in_progress',
    'blocked',
    'completed',
    'cancelled'
] as const;

/**
 * Array of valid EpicStatus values for runtime validation.
 */
export const EPIC_STATUS_VALUES: readonly EpicStatus[] = [
    'backlog',
    'in_progress',
    'completed',
    'cancelled'
] as const;

/**
 * Type guard to check if a string is a valid TaskStatus.
 * @param value - The value to check
 * @returns True if the value is a valid TaskStatus
 */
export function isTaskStatus(value: unknown): value is TaskStatus {
    return typeof value === 'string' && TASK_STATUS_VALUES.includes(value as TaskStatus);
}

/**
 * Type guard to check if a string is a valid EpicStatus.
 * @param value - The value to check
 * @returns True if the value is a valid EpicStatus
 */
export function isEpicStatus(value: unknown): value is EpicStatus {
    return typeof value === 'string' && EPIC_STATUS_VALUES.includes(value as EpicStatus);
}
