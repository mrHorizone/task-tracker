import type {Task} from "../types/task.ts";
import {Status} from "../types/status.ts";
import {authService} from "./authService.ts";

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

function getAuthHeaders(): HeadersInit {
    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
    };
    const token = authService.getToken();
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
}

export const taskService = {
    async getTasks(): Promise<Task[]> {
        const response = await fetch(`${API_BASE_URL}/tasks`, {
            headers: getAuthHeaders(),
        });
        if (response.status === 401) {
            authService.logout();
            window.location.href = '/login';
            throw new Error('Unauthorized');
        }
        if (!response.ok) {
            throw new Error(`Failed to fetch tasks: ${response.statusText}`);
        }
        return response.json();
    },

    async createTask(task: { title: string; text: string; status?: Status }): Promise<Task> {
        const response = await fetch(`${API_BASE_URL}/tasks`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(task),
        });
        if (response.status === 401) {
            authService.logout();
            window.location.href = '/login';
            throw new Error('Unauthorized');
        }
        if (!response.ok) {
            throw new Error(`Failed to create task: ${response.statusText}`);
        }
        return response.json();
    },

    async updateTask(id: number, task: Partial<{ title: string; text: string; status: Status }>): Promise<Task> {
        const response = await fetch(`${API_BASE_URL}/tasks/${id}`, {
            method: 'PATCH',
            headers: getAuthHeaders(),
            body: JSON.stringify(task),
        });
        if (response.status === 401) {
            authService.logout();
            window.location.href = '/login';
            throw new Error('Unauthorized');
        }
        if (!response.ok) {
            throw new Error(`Failed to update task: ${response.statusText}`);
        }
        return response.json();
    },

    async deleteTask(id: number): Promise<{ success: boolean }> {
        const response = await fetch(`${API_BASE_URL}/tasks/${id}`, {
            method: 'DELETE',
            headers: getAuthHeaders(),
        });
        if (response.status === 401) {
            authService.logout();
            window.location.href = '/login';
            throw new Error('Unauthorized');
        }
        if (!response.ok) {
            throw new Error(`Failed to delete task: ${response.statusText}`);
        }
        return response.json();
    },

    async exportTasksToCsv(): Promise<{ jobId: string; message: string }> {
        const response = await fetch(`${API_BASE_URL}/tasks/export/csv`, {
            method: 'POST',
            headers: getAuthHeaders(),
        });
        if (response.status === 401) {
            authService.logout();
            window.location.href = '/login';
            throw new Error('Unauthorized');
        }
        if (!response.ok) {
            throw new Error(`Failed to queue export: ${response.statusText}`);
        }
        return response.json();
    },

    async downloadExportFile(fileId: string, filename?: string): Promise<void> {
        const headers: Record<string, string> = {};
        const token = authService.getToken();
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
        const response = await fetch(`${API_BASE_URL}/tasks/export/${fileId}`, {
            headers,
        });
        if (response.status === 401) {
            authService.logout();
            window.location.href = '/login';
            throw new Error('Unauthorized');
        }
        if (!response.ok) {
            throw new Error(`Failed to download export file: ${response.statusText}`);
        }
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename || `tasks-export-${fileId}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
    }
};
