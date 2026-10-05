import {describe, it, expect} from 'vitest';
import {escapeCsvField, convertTasksToCsv} from './task-export.helper.js';

describe('TaskExportHelper', () => {
    describe('escapeCsvField', () => {
        it('should return empty string for null and undefined', () => {
            expect(escapeCsvField(null)).toBe('');
            expect(escapeCsvField(undefined)).toBe('');
        });

        it('should return plain text as-is if no comma, quotes, or newlines', () => {
            expect(escapeCsvField('Hello world')).toBe('Hello world');
            expect(escapeCsvField(123)).toBe('123');
        });

        it('should wrap in quotes and escape inner quotes if string has commas or quotes or newlines', () => {
            expect(escapeCsvField('hello,world')).toBe('"hello,world"');
            expect(escapeCsvField('hello "friend"')).toBe('"hello ""friend"""');
            expect(escapeCsvField('line 1\nline 2')).toBe('"line 1\nline 2"');
        });

        it('should sanitize formula injection characters', () => {
            expect(escapeCsvField('=SUM(A1:A10)')).toBe("'=SUM(A1:A10)");
            expect(escapeCsvField('+12345')).toBe("'+12345");
            expect(escapeCsvField('-cmd|...')).toBe("'-cmd|...");
            expect(escapeCsvField('@SUM')).toBe("'@SUM");
        });
    });

    describe('convertTasksToCsv', () => {
        it('should produce headers and valid CSV rows', () => {
            const date = new Date('2026-01-01T12:00:00.000Z');
            const tasks = [
                {
                    id: 1,
                    title: 'Test Task',
                    text: 'Description with, comma and "quotes"',
                    status: 'TODO',
                    author: {login: 'john_doe'},
                    updatedBy: {login: 'jane_doe'},
                    createdAt: date,
                    updatedAt: date,
                },
                {
                    id: 2,
                    title: 'Second Task',
                    text: 'Simple desc',
                    status: 'DONE',
                    author: null,
                    updatedBy: null,
                    createdAt: '2026-01-02T10:00:00.000Z',
                    updatedAt: '2026-01-02T11:00:00.000Z',
                },
            ];

            const csv = convertTasksToCsv(tasks);
            const lines = csv.split('\n');

            expect(lines[0]).toBe('id,title,text,status,author,updatedBy,createdAt,updatedAt');
            expect(lines[1]).toBe('1,Test Task,"Description with, comma and ""quotes""",TODO,john_doe,jane_doe,2026-01-01T12:00:00.000Z,2026-01-01T12:00:00.000Z');
            expect(lines[2]).toBe('2,Second Task,Simple desc,DONE,,,2026-01-02T10:00:00.000Z,2026-01-02T11:00:00.000Z');
        });

        it('should handle empty task list', () => {
            const csv = convertTasksToCsv([]);
            expect(csv).toBe('id,title,text,status,author,updatedBy,createdAt,updatedAt');
        });
    });
});
