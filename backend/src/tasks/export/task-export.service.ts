import {Injectable, NotFoundException, Logger} from '@nestjs/common';
import PQueue from 'p-queue';
import * as fs from 'fs';
import * as fsPromises from 'fs/promises';
import * as path from 'path';
import {randomUUID} from 'crypto';
import {TaskEventUser, TasksGateway} from '../tasks.gateway.js';
import {PrismaService} from '../../prisma/prisma.service.js';
import {convertTasksToCsv} from './task-export.helper.js';

export interface ExportJobResult {
    fileId: string;
    filename: string;
    count: number;
}

@Injectable()
export class TaskExportService {
    private readonly logger = new Logger(TaskExportService.name);
    private readonly exportsDir: string;
    private readonly queue: PQueue;

    constructor(
        private readonly prisma: PrismaService,
        private readonly tasksGateway: TasksGateway,
    ) {
        this.exportsDir = path.resolve(process.cwd(), 'data', 'exports');
        if (!fs.existsSync(this.exportsDir)) {
            fs.mkdirSync(this.exportsDir, {recursive: true});
        }
        // Concurrency limit of 2 simultaneous CSV exports
        this.queue = new PQueue({concurrency: 2});
    }

    getExportsDirectory(): string {
        return this.exportsDir;
    }

    async triggerExport(user?: TaskEventUser): Promise<{ jobId: string; message: string }> {
        const jobId = randomUUID();

        // Enqueue background export job
        void this.queue.add(async () => {
            await this.processExport(jobId, user);
        });

        return {
            jobId,
            message: 'Task export to CSV queued successfully',
        };
    }

    private async processExport(jobId: string, user?: TaskEventUser): Promise<ExportJobResult | void> {
        this.logger.log(`Starting CSV export job ${jobId} initiated by user: ${user?.login || 'system'}`);
        this.tasksGateway.sendTaskExportStarted(jobId, user);

        try {
            const tasks = await this.prisma.task.findMany({
                orderBy: {id: 'asc'},
                include: {
                    author: {
                        select: {
                            id: true,
                            login: true,
                        },
                    },
                    updatedBy: {
                        select: {
                            id: true,
                            login: true,
                        },
                    },
                },
            });

            const csvContent = convertTasksToCsv(tasks);
            const fileId = randomUUID();
            const filename = `tasks-export-${fileId}.csv`;
            const filePath = path.join(this.exportsDir, filename);

            await fsPromises.writeFile(filePath, csvContent, 'utf-8');

            const result: ExportJobResult = {
                fileId,
                filename,
                count: tasks.length,
            };

            this.logger.log(`CSV export job ${jobId} completed. Exported ${tasks.length} tasks to ${filename}`);
            this.tasksGateway.sendTaskExportCompleted({
                jobId,
                fileId,
                filename,
                count: tasks.length,
                user,
            });

            return result;
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error during CSV export';
            this.logger.error(`CSV export job ${jobId} failed: ${errorMessage}`, error instanceof Error ? error.stack : undefined);
            this.tasksGateway.sendTaskExportFailed({
                jobId,
                error: errorMessage,
                user,
            });
        }
    }

    getExportFile(fileId: string): { filePath: string; filename: string } {
        const safeFileId = path.basename(fileId).replace(/[^a-zA-Z0-9_-]/g, '');
        const filename = `tasks-export-${safeFileId}.csv`;
        const filePath = path.join(this.exportsDir, filename);

        if (!fs.existsSync(filePath)) {
            throw new NotFoundException(`Export file '${fileId}' not found or has expired`);
        }

        return {filePath, filename};
    }
}
