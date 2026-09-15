import { Controller, Get, Post, Put, Delete, Body, Param, ParseIntPipe, NotFoundException } from '@nestjs/common';
import { TasksService } from "./tasks.service";
import { Task } from "./task.types";

@Controller('tasks')
export class TasksController {
    constructor(private readonly tasksService: TasksService) {}

    @Get()
    async getTasks(): Promise<Task[]> {
        return this.tasksService.getTasks();
    }

    @Post()
    async createTask(@Body() body: { title: string; text: string }): Promise<Task> {
        return this.tasksService.createTask(body);
    }

    @Put(':id')
    async updateTask(
        @Param('id', ParseIntPipe) id: number,
        @Body() body: { title?: string; text?: string }
    ): Promise<Task> {
        const updated = await this.tasksService.updateTask(id, body);
        if (!updated) {
            throw new NotFoundException(`Task with id ${id} not found`);
        }
        return updated;
    }

    @Delete(':id')
    async deleteTask(@Param('id', ParseIntPipe) id: number): Promise<{ success: boolean }> {
        const deleted = await this.tasksService.deleteTask(id);
        if (!deleted) {
            throw new NotFoundException(`Task with id ${id} not found`);
        }
        return { success: true };
    }
}
