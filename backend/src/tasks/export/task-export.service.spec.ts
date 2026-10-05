import {describe, it, expect, beforeEach, vi} from 'vitest';
import {NotFoundException} from '@nestjs/common';
import {TaskExportService} from './task-export.service.js';
import * as fs from 'fs';
import * as path from 'path';

describe('TaskExportService', () => {
    let service: TaskExportService;
    let prismaMock: {
        task: {
            findMany: ReturnType<typeof vi.fn>;
        };
    };
    let gatewayMock: {
        sendTaskExportStarted: ReturnType<typeof vi.fn>;
        sendTaskExportCompleted: ReturnType<typeof vi.fn>;
        sendTaskExportFailed: ReturnType<typeof vi.fn>;
    };

    beforeEach(() => {
        prismaMock = {
            task: {
                findMany: vi.fn().mockResolvedValue([
                    {
                        id: 1,
                        title: 'Task 1',
                        text: 'Description 1',
                        status: 'TODO',
                        createdAt: new Date('2026-01-01T00:00:00.000Z'),
                        updatedAt: new Date('2026-01-01T00:00:00.000Z'),
                        author: {id: 1, login: 'alice'},
                        updatedBy: null,
                    },
                ]),
            },
        };

        gatewayMock = {
            sendTaskExportStarted: vi.fn(),
            sendTaskExportCompleted: vi.fn(),
            sendTaskExportFailed: vi.fn(),
        };

        service = new TaskExportService(prismaMock as any, gatewayMock as any);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('triggerExport', () => {
        it('should enqueue a job and process export in background', async () => {
            const user = {id: 1, login: 'user1'};
            const result = await service.triggerExport(user);

            expect(result.jobId).toBeDefined();
            expect(result.message).toBe('Task export to CSV queued successfully');

            // Wait for queue to process
            await (service as any).queue.onIdle();

            expect(gatewayMock.sendTaskExportStarted).toHaveBeenCalledWith(result.jobId, user);
            expect(prismaMock.task.findMany).toHaveBeenCalled();
            expect(gatewayMock.sendTaskExportCompleted).toHaveBeenCalledWith(
                expect.objectContaining({
                    jobId: result.jobId,
                    count: 1,
                    user,
                })
            );

            // Clean up exported file
            const completedCall = gatewayMock.sendTaskExportCompleted.mock.calls[0][0];
            const filePath = path.join(service.getExportsDirectory(), completedCall.filename);
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
        });

        it('should handle export error and notify gateway', async () => {
            prismaMock.task.findMany.mockRejectedValue(new Error('Database query error'));

            const user = {id: 2, login: 'user2'};
            const result = await service.triggerExport(user);

            await (service as any).queue.onIdle();

            expect(gatewayMock.sendTaskExportStarted).toHaveBeenCalledWith(result.jobId, user);
            expect(gatewayMock.sendTaskExportFailed).toHaveBeenCalledWith({
                jobId: result.jobId,
                error: 'Database query error',
                user,
            });
        });
    });

    describe('getExportFile', () => {
        it('should throw NotFoundException if export file does not exist', () => {
            expect(() => service.getExportFile('non-existent-uuid')).toThrow(NotFoundException);
        });

        it('should return filePath and filename if export file exists', () => {
            const exportsDir = service.getExportsDirectory();
            const fileId = 'test-file-123';
            const filename = `tasks-export-${fileId}.csv`;
            const filePath = path.join(exportsDir, filename);

            fs.writeFileSync(filePath, 'id,title\n1,Task 1', 'utf-8');

            try {
                const result = service.getExportFile(fileId);
                expect(result.filePath).toBe(filePath);
                expect(result.filename).toBe(filename);
            } finally {
                if (fs.existsSync(filePath)) {
                    fs.unlinkSync(filePath);
                }
            }
        });
    });
});
