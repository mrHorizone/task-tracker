import type { Task } from "../types/task.ts";

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export const taskService = {
    async getTasks(): Promise<Task[]> {
        const response = await fetch(`${API_BASE_URL}/tasks`);
        if (!response.ok) {
            throw new Error(`Failed to fetch tasks: ${response.statusText}`);
        }
        return response.json();
    },

    async createTask(task: { title: string; text: string }): Promise<Task> {
        const response = await fetch(`${API_BASE_URL}/tasks`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(task),
        });
        if (!response.ok) {
            throw new Error(`Failed to create task: ${response.statusText}`);
        }
        return response.json();
    },

    async updateTask(id: number, task: Partial<{ title: string; text: string }>): Promise<Task> {
        const response = await fetch(`${API_BASE_URL}/tasks/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(task),
        });
        if (!response.ok) {
            throw new Error(`Failed to update task: ${response.statusText}`);
        }
        return response.json();
    },

    async deleteTask(id: number): Promise<{ success: boolean }> {
        const response = await fetch(`${API_BASE_URL}/tasks/${id}`, {
            method: 'DELETE',
        });
        if (!response.ok) {
            throw new Error(`Failed to delete task: ${response.statusText}`);
        }
        return response.json();
    }
};
