import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import * as fs from 'fs/promises';
import * as path from 'path';
import { Task } from './task.types';

@Injectable()
export class TasksService implements OnModuleInit {
    private readonly logger = new Logger(TasksService.name);
    private readonly filePath = path.resolve(process.cwd(), 'data', 'tasks.json');

    async onModuleInit() {
        await this.ensureFileExists();
    }

    private async ensureFileExists(): Promise<void> {
        try {
            await fs.mkdir(path.dirname(this.filePath), { recursive: true });
            await fs.access(this.filePath);
        } catch {
            const initialTasks: Task[] = [
              {
                id: 1,
                title: 'Postgres integration',
                text: 'Understand controllers and services',
              },
              {
                id: 2,
                title: 'Statuses',
                text: 'Implement statuses for task. Most likely TODO, IN_PROGRESS, DONE',
              },
              {
                id: 3,
                title: 'Implement authentication',
                text: 'User entity | Login form | JWT',
              },
              {
                id: 4,
                title: 'Task creator/assignee',
                text: 'Add creators field for task and assignee managing',
              },
              {
                id: 5,
                title: 'Notification service',
                text: 'Implement a notification service for task changes',
              },
              {
                id: 6,
                title: 'Use messages broker',
                text: 'Use any message broker to implement some high load task',
              },
            ];
            await fs.writeFile(this.filePath, JSON.stringify(initialTasks, null, 2), 'utf-8');
            this.logger.log(`Initialized storage file at ${this.filePath}`);
        }
    }

    private async readData(): Promise<Task[]> {
        try {
            const fileContent = await fs.readFile(this.filePath, 'utf-8');
            return JSON.parse(fileContent) as Task[];
        } catch (error) {
            this.logger.error('Failed to read tasks file:', error);
            return [];
        }
    }

    private async writeData(tasks: Task[]): Promise<void> {
        try {
            await fs.writeFile(this.filePath, JSON.stringify(tasks, null, 2), 'utf-8');
        } catch (error) {
            this.logger.error('Failed to write tasks file:', error);
        }
    }

    async getTasks(): Promise<Task[]> {
        return this.readData();
    }

    async createTask(taskData: Omit<Task, 'id'>): Promise<Task> {
        const tasks = await this.readData();
        const newTask: Task = {
            id: Date.now(),
            ...taskData
        };
        tasks.push(newTask);
        await this.writeData(tasks);
        return newTask;
    }

    async updateTask(id: number, updatedFields: Partial<Omit<Task, 'id'>>): Promise<Task | null> {
        const tasks = await this.readData();
        const taskIndex = tasks.findIndex(task => task.id === id);
        if (taskIndex === -1) return null;

        tasks[taskIndex] = { ...tasks[taskIndex], ...updatedFields };
        await this.writeData(tasks);
        return tasks[taskIndex];
    }

    async deleteTask(id: number): Promise<boolean> {
        const tasks = await this.readData();
        const filteredTasks = tasks.filter(task => task.id !== id);
        if (filteredTasks.length === tasks.length) return false;

        await this.writeData(filteredTasks);
        return true;
    }
}
