import type { User } from "../types/user.ts";

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export const userService = {
    async getUsers(): Promise<User[]> {
        const response = await fetch(`${API_BASE_URL}/users`);
        if (!response.ok) {
            throw new Error(`Failed to fetch users: ${response.statusText}`);
        }
        return response.json();
    },

    async getUserById(id: number): Promise<User> {
        const response = await fetch(`${API_BASE_URL}/users/${id}`);
        if (!response.ok) {
            throw new Error(`Failed to fetch user: ${response.statusText}`);
        }
        return response.json();
    },

    async createUser(user: { login: string; password: string }): Promise<User> {
        const response = await fetch(`${API_BASE_URL}/users`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(user),
        });
        if (!response.ok) {
            throw new Error(`Failed to create user: ${response.statusText}`);
        }
        return response.json();
    },

    async updateUser(id: number, user: Partial<{ login: string; password: string }>): Promise<User> {
        const response = await fetch(`${API_BASE_URL}/users/${id}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(user),
        });
        if (!response.ok) {
            throw new Error(`Failed to update user: ${response.statusText}`);
        }
        return response.json();
    },

    async deleteUser(id: number): Promise<{ success: boolean; id: number }> {
        const response = await fetch(`${API_BASE_URL}/users/${id}`, {
            method: 'DELETE',
        });
        if (!response.ok) {
            throw new Error(`Failed to delete user: ${response.statusText}`);
        }
        return response.json();
    }
};
