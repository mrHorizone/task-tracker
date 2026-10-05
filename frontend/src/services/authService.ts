import type {AuthResponse, User} from "../types/user.ts";
import {apiRequest} from "./apiClient.ts";

const TOKEN_KEY = 'accessToken';
const USER_KEY = 'currentUser';

export const authService = {
    async register(credentials: { login: string; password: string }): Promise<AuthResponse> {
        const data = await apiRequest<AuthResponse>('/auth/register', {
            method: 'POST',
            body: JSON.stringify(credentials),
        });
        this.saveAuth(data);
        return data;
    },

    async login(credentials: { login: string; password: string }): Promise<AuthResponse> {
        const data = await apiRequest<AuthResponse>('/auth/login', {
            method: 'POST',
            body: JSON.stringify(credentials),
        });
        this.saveAuth(data);
        return data;
    },

    saveAuth(authResponse: AuthResponse): void {
        if (authResponse.accessToken) {
            localStorage.setItem(TOKEN_KEY, authResponse.accessToken);
        }
        if (authResponse.user) {
            localStorage.setItem(USER_KEY, JSON.stringify(authResponse.user));
        }
    },

    getToken(): string | null {
        return localStorage.getItem(TOKEN_KEY);
    },

    getUser(): User | null {
        const userStr = localStorage.getItem(USER_KEY);
        if (!userStr) return null;
        try {
            return JSON.parse(userStr);
        } catch {
            return null;
        }
    },

    logout(): void {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
    },

    isAuthenticated(): boolean {
        return !!this.getToken();
    }
};
