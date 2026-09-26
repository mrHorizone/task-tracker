import {Injectable, NotFoundException} from '@nestjs/common';
import {PrismaService} from '../prisma/prisma.service.js';
import {TasksGateway} from './tasks.gateway.js';
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

    async create(createTaskDto: CreateTaskDto): Promise<Task> {
        const task = await this.prisma.task.create({
            data: createTaskDto,
        });
        this.tasksGateway.sendTaskCreated(task);
        return task;
    }

    async findAll(): Promise<Task[]> {
        return this.prisma.task.findMany({
            orderBy: {id: 'asc'},
        });
    }

    async findOne(id: number): Promise<Task> {
        const task = await this.prisma.task.findUnique({
            where: {id},
        });
        if (!task) {
            throw new NotFoundException(`Task with ID ${id} not found`);
        }
        return task;
    }

    async update(id: number, updateTaskDto: UpdateTaskDto): Promise<Task> {
        await this.findOne(id);
        const updated = await this.prisma.task.update({
            where: {id},
            data: updateTaskDto,
        });
        this.tasksGateway.sendTaskUpdated(updated);
        return updated;
    }

    async remove(id: number): Promise<{ success: boolean; id: number }> {
        await this.findOne(id);
        await this.prisma.task.delete({
            where: {id},
        });
        this.tasksGateway.sendTaskDeleted(id);
        return {success: true, id};
    }
}
