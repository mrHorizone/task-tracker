import type { User } from "../types/user.ts";

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export const authService = {
    async register(credentials: { login: string; password: string }): Promise<User> {
        const response = await fetch(`${API_BASE_URL}/auth/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(credentials),
        });
        if (!response.ok) {
            throw new Error(`Failed to register: ${response.statusText}`);
        }
        return response.json();
    },

    async login(credentials: { login: string; password: string }): Promise<User> {
        const response = await fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(credentials),
        });
        if (!response.ok) {
            throw new Error(`Failed to login: ${response.statusText}`);
        }
        return response.json();
    }
};
