export function escapeCsvField(value: unknown): string {
    if (value === null || value === undefined) {
        return '';
    }
    const stringValue = String(value);
    if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n') || stringValue.includes('\r')) {
        return `"${stringValue.replace(/"/g, '""')}"`;
    }
    return stringValue;
}

export interface TaskExportRecord {
    id: number;
    title: string;
    text: string;
    status: string;
    createdAt: Date | string;
    updatedAt: Date | string;
    author?: { login: string } | null;
    updatedBy?: { login: string } | null;
}

export function convertTasksToCsv(tasks: TaskExportRecord[]): string {
    const headers = ['id', 'title', 'text', 'status', 'author', 'updatedBy', 'createdAt', 'updatedAt'];
    const rows = tasks.map((task) =>
        [
            task.id,
            task.title,
            task.text,
            task.status,
            task.author?.login ?? '',
            task.updatedBy?.login ?? '',
            task.createdAt instanceof Date ? task.createdAt.toISOString() : task.createdAt,
            task.updatedAt instanceof Date ? task.updatedAt.toISOString() : task.updatedAt,
        ]
            .map(escapeCsvField)
            .join(','),
    );

    return [headers.join(','), ...rows].join('\n');
}
