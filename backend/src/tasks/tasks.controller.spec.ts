import {Test, TestingModule} from '@nestjs/testing';
import * as fs from 'fs';
import * as path from 'path';
import {TasksController} from './tasks.controller.js';
import {TasksService} from './tasks.service.js';
import {TaskExportService} from './export/task-export.service.js';
import {JwtAuthGuard} from '../auth/jwt-auth.guard.js';

describe('TasksController', () => {
    let controller: TasksController;
    let service: {
        create: ReturnType<typeof vi.fn>;
        findAll: ReturnType<typeof vi.fn>;
        findOne: ReturnType<typeof vi.fn>;
        update: ReturnType<typeof vi.fn>;
        remove: ReturnType<typeof vi.fn>;
    };
    let exportService: {
        triggerExport: ReturnType<typeof vi.fn>;
        getExportFile: ReturnType<typeof vi.fn>;
    };

    beforeEach(async () => {
        service = {
            create: vi.fn(),
            findAll: vi.fn(),
            findOne: vi.fn(),
            update: vi.fn(),
            remove: vi.fn(),
        };

        exportService = {
            triggerExport: vi.fn(),
            getExportFile: vi.fn(),
        };

        const module: TestingModule = await Test.createTestingModule({
            controllers: [TasksController],
            providers: [
                {
                    provide: TasksService,
                    useValue: service,
                },
                {
                    provide: TaskExportService,
                    useValue: exportService,
                },
            ],
        })
            .overrideGuard(JwtAuthGuard)
            .useValue({canActivate: () => true})
            .compile();

        controller = module.get<TasksController>(TasksController);
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });

    const mockUser = {id: 1, login: 'user1'};

    describe('exportTasks', () => {
        it('should trigger task export to CSV', async () => {
            const queueResponse = {jobId: '123', message: 'Task export to CSV queued successfully'};
            exportService.triggerExport.mockResolvedValue(queueResponse);

            const result = await controller.exportTasks(mockUser);
            expect(result).toEqual(queueResponse);
            expect(exportService.triggerExport).toHaveBeenCalledWith(mockUser);
        });
    });

    describe('downloadExport', () => {
        const testFileId = 'test-download-file';
        const tempExportsDir = path.resolve(process.cwd(), 'data', 'exports');
        const testFilePath = path.join(tempExportsDir, `tasks-export-${testFileId}.csv`);

        afterEach(() => {
            if (fs.existsSync(testFilePath)) {
                try {
                    fs.unlinkSync(testFilePath);
                } catch {
                    // Ignore cleanup failure
                }
            }
        });

        it('should return a StreamableFile for the requested export', async () => {
            if (!fs.existsSync(tempExportsDir)) {
                fs.mkdirSync(tempExportsDir, {recursive: true});
            }
            fs.writeFileSync(testFilePath, 'id,title\n1,Test', 'utf-8');

            exportService.getExportFile.mockReturnValue({
                filePath: testFilePath,
                filename: `tasks-export-${testFileId}.csv`,
            });

            const resMock = {
                set: vi.fn(),
            };

            const result = controller.downloadExport(testFileId, resMock as any);
            expect(exportService.getExportFile).toHaveBeenCalledWith(testFileId);
            expect(resMock.set).toHaveBeenCalledWith({
                'Content-Type': 'text/csv; charset=utf-8',
                'Content-Disposition': `attachment; filename="tasks-export-${testFileId}.csv"`,
            });
            expect(result).toBeDefined();
            
            const stream = result.getStream() as any;
            await new Promise<void>((resolve) => {
                stream.on('open', () => {
                    stream.destroy();
                    resolve();
                });
                stream.on('error', () => {
                    resolve();
                });
            });
        });
    });

    describe('create', () => {
        it('should create a task', async () => {
            const dto = {title: 'Task', text: 'Desc'};
            const created = {id: 1, ...dto};
            service.create.mockResolvedValue(created);

            const result = await controller.create(dto, mockUser);
            expect(result).toEqual(created);
            expect(service.create).toHaveBeenCalledWith(dto, mockUser);
        });
    });

    describe('findAll', () => {
        it('should return all tasks', async () => {
            const tasks = [{id: 1, title: 'Task 1', text: 'Desc 1'}];
            service.findAll.mockResolvedValue(tasks);

            const result = await controller.findAll();
            expect(result).toEqual(tasks);
            expect(service.findAll).toHaveBeenCalled();
        });
    });

    describe('findOne', () => {
        it('should return a task by id', async () => {
            const task = {id: 1, title: 'Task 1', text: 'Desc 1'};
            service.findOne.mockResolvedValue(task);

            const result = await controller.findOne(1);
            expect(result).toEqual(task);
            expect(service.findOne).toHaveBeenCalledWith(1);
        });
    });

    describe('update', () => {
        it('should update a task', async () => {
            const dto = {title: 'Updated'};
            const updated = {id: 1, title: 'Updated', text: 'Desc'};
            service.update.mockResolvedValue(updated);

            const result = await controller.update(1, dto, mockUser);
            expect(result).toEqual(updated);
            expect(service.update).toHaveBeenCalledWith(1, dto, mockUser);
        });
    });

    describe('remove', () => {
        it('should delete a task', async () => {
            service.remove.mockResolvedValue({success: true, id: 1});

            const result = await controller.remove(1, mockUser);
            expect(result).toEqual({success: true, id: 1});
            expect(service.remove).toHaveBeenCalledWith(1, mockUser);
        });
    });
});
