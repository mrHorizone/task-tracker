import {Status, type Task} from "../types";
import {apiDownload, apiRequest} from "./apiClient.ts";

export const taskService = {
    getTasks(): Promise<Task[]> {
        return apiRequest<Task[]>('/tasks');
    },

    createTask(task: { title: string; text: string; status?: Status }): Promise<Task> {
        return apiRequest<Task>('/tasks', {
            method: 'POST',
            body: JSON.stringify(task),
        });
    },

    updateTask(id: number, task: Partial<{ title: string; text: string; status: Status }>): Promise<Task> {
        return apiRequest<Task>(`/tasks/${id}`, {
            method: 'PATCH',
            body: JSON.stringify(task),
        });
    },

    deleteTask(id: number): Promise<{ success: boolean }> {
        return apiRequest<{ success: boolean }>(`/tasks/${id}`, {
            method: 'DELETE',
        });
    },

    exportTasksToCsv(): Promise<{ jobId: string; message: string }> {
        return apiRequest<{ jobId: string; message: string }>('/tasks/export/csv', {
            method: 'POST',
        });
    },

    downloadExportFile(fileId: string, filename?: string): Promise<void> {
        return apiDownload(`/tasks/export/${fileId}`, filename || `tasks-export-${fileId}.csv`);
    }
};
