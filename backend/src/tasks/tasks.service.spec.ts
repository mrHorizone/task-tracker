import {Test, TestingModule} from '@nestjs/testing';
import {NotFoundException} from '@nestjs/common';
import {TasksService} from './tasks.service.js';
import {TasksGateway} from './tasks.gateway.js';
import {PrismaService} from '../prisma/prisma.service.js';

describe('TasksService', () => {
    let service: TasksService;
    let gateway: {
        sendTaskCreated: ReturnType<typeof vi.fn>;
        sendTaskUpdated: ReturnType<typeof vi.fn>;
        sendTaskDeleted: ReturnType<typeof vi.fn>;
    };
    let prisma: {
        task: {
            create: ReturnType<typeof vi.fn>;
            findMany: ReturnType<typeof vi.fn>;
            findUnique: ReturnType<typeof vi.fn>;
            update: ReturnType<typeof vi.fn>;
            delete: ReturnType<typeof vi.fn>;
        };
    };

    beforeEach(async () => {
        gateway = {
            sendTaskCreated: vi.fn(),
            sendTaskUpdated: vi.fn(),
            sendTaskDeleted: vi.fn(),
        };

        prisma = {
            task: {
                create: vi.fn(),
                findMany: vi.fn(),
                findUnique: vi.fn(),
                update: vi.fn(),
                delete: vi.fn(),
            },
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                TasksService,
                {
                    provide: PrismaService,
                    useValue: prisma,
                },
                {
                    provide: TasksGateway,
                    useValue: gateway,
                },
            ],
        }).compile();

        service = module.get<TasksService>(TasksService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('create', () => {
        it('should create a task and notify gateway', async () => {
            const dto = {title: 'Test Task', text: 'Test description'};
            const createdTask = {id: 1, ...dto};
            prisma.task.create.mockResolvedValue(createdTask);

            const result = await service.create(dto);
            expect(result).toEqual(createdTask);
            expect(prisma.task.create).toHaveBeenCalledWith({data: dto});
            expect(gateway.sendTaskCreated).toHaveBeenCalledWith(createdTask);
        });
    });

    describe('findAll', () => {
        it('should return an array of tasks', async () => {
            const tasks = [
                {id: 1, title: 'Task 1', text: 'Desc 1'},
                {id: 2, title: 'Task 2', text: 'Desc 2'},
            ];
            prisma.task.findMany.mockResolvedValue(tasks);

            const result = await service.findAll();
            expect(result).toEqual(tasks);
            expect(prisma.task.findMany).toHaveBeenCalledWith({
                orderBy: {id: 'asc'},
            });
        });
    });

    describe('findOne', () => {
        it('should return a task if found', async () => {
            const task = {id: 1, title: 'Task 1', text: 'Desc 1'};
            prisma.task.findUnique.mockResolvedValue(task);

            const result = await service.findOne(1);
            expect(result).toEqual(task);
            expect(prisma.task.findUnique).toHaveBeenCalledWith({where: {id: 1}});
        });

        it('should throw NotFoundException if task not found', async () => {
            prisma.task.findUnique.mockResolvedValue(null);

            await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
        });
    });

    describe('update', () => {
        it('should update, return a task and notify gateway', async () => {
            const existingTask = {id: 1, title: 'Task 1', text: 'Desc 1', status: 'TODO'};
            const updateDto = {title: 'Updated Title', status: 'IN_PROGRESS' as any};
            const updatedTask = {...existingTask, ...updateDto};

            prisma.task.findUnique.mockResolvedValue(existingTask);
            prisma.task.update.mockResolvedValue(updatedTask);

            const result = await service.update(1, updateDto);
            expect(result).toEqual(updatedTask);
            expect(prisma.task.update).toHaveBeenCalledWith({
                where: {id: 1},
                data: updateDto,
            });
            expect(gateway.sendTaskUpdated).toHaveBeenCalledWith(updatedTask);
        });

        it('should throw NotFoundException if task to update does not exist', async () => {
            prisma.task.findUnique.mockResolvedValue(null);

            await expect(service.update(999, {title: 'New'})).rejects.toThrow(
                NotFoundException,
            );
        });
    });

    describe('remove', () => {
        it('should delete a task, return success and notify gateway', async () => {
            const existingTask = {id: 1, title: 'Task 1', text: 'Desc 1'};
            prisma.task.findUnique.mockResolvedValue(existingTask);
            prisma.task.delete.mockResolvedValue(existingTask);

            const result = await service.remove(1);
            expect(result).toEqual({success: true, id: 1});
            expect(prisma.task.delete).toHaveBeenCalledWith({where: {id: 1}});
            expect(gateway.sendTaskDeleted).toHaveBeenCalledWith(1);
        });

        it('should throw NotFoundException if task to delete does not exist', async () => {
            prisma.task.findUnique.mockResolvedValue(null);

            await expect(service.remove(999)).rejects.toThrow(NotFoundException);
        });
    });
});
