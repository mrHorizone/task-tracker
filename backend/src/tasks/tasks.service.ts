import {Injectable, NotFoundException} from '@nestjs/common';
import {PrismaService} from '../prisma/prisma.service.js';
import {TasksGateway, TaskEventUser} from './tasks.gateway.js';
import {CreateTaskDto} from './dto/create-task.dto.js';
import {UpdateTaskDto} from './dto/update-task.dto.js';
import {Task} from '@prisma/client';

@Injectable()
export class TasksService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly tasksGateway: TasksGateway,
    ) {
    }

    private readonly taskInclude = {
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
    };

    async create(createTaskDto: CreateTaskDto, user?: TaskEventUser): Promise<Task> {
        const task = await this.prisma.task.create({
            data: {
                ...createTaskDto,
                ...(user?.id ? {authorId: user.id} : {}),
            },
            include: this.taskInclude,
        });
        this.tasksGateway.sendTaskCreated(task, user);
        return task;
    }

    async findAll(): Promise<Task[]> {
        return this.prisma.task.findMany({
            orderBy: {id: 'asc'},
            include: this.taskInclude,
        });
    }

    async findOne(id: number): Promise<Task> {
        const task = await this.prisma.task.findUnique({
            where: {id},
            include: this.taskInclude,
        });
        if (!task) {
            throw new NotFoundException(`Task with ID ${id} not found`);
        }
        return task;
    }

    async update(id: number, updateTaskDto: UpdateTaskDto, user?: TaskEventUser): Promise<Task> {
        await this.findOne(id);
        const updated = await this.prisma.task.update({
            where: {id},
            data: {
                ...updateTaskDto,
                ...(user?.id ? {updatedById: user.id} : {}),
            },
            include: this.taskInclude,
        });
        this.tasksGateway.sendTaskUpdated(updated, user);
        return updated;
    }

    async remove(id: number, user?: TaskEventUser): Promise<{ success: boolean; id: number }> {
        const existing = await this.findOne(id);
        await this.prisma.task.delete({
            where: {id},
        });
        this.tasksGateway.sendTaskDeleted(id, user, existing?.title);
        return {success: true, id};
    }
}
