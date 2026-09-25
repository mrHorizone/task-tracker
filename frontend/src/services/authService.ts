import type {AuthResponse, User} from "../types/user.ts";

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
const TOKEN_KEY = 'accessToken';
const USER_KEY = 'currentUser';

export const authService = {
    async register(credentials: { login: string; password: string }): Promise<AuthResponse> {
        const response = await fetch(`${API_BASE_URL}/auth/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(credentials),
        });
        if (!response.ok) {
            let errorMessage = response.statusText;
            try {
                const errorBody = await response.json();
                if (errorBody && errorBody.message) {
                    errorMessage = Array.isArray(errorBody.message)
                        ? errorBody.message.join(', ')
                        : errorBody.message;
                }
            } catch {
                // ignore json parse failure
            }
            throw new Error(`Failed to register: ${errorMessage}`);
        }
        const data: AuthResponse = await response.json();
        this.saveAuth(data);
        return data;
    },

    async login(credentials: { login: string; password: string }): Promise<AuthResponse> {
        const response = await fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(credentials),
        });
        if (!response.ok) {
            let errorMessage = response.statusText;
            try {
                const errorBody = await response.json();
                if (errorBody && errorBody.message) {
                    errorMessage = Array.isArray(errorBody.message)
                        ? errorBody.message.join(', ')
                        : errorBody.message;
                }
            } catch {
                // ignore json parse failure
            }
            throw new Error(`Failed to login: ${errorMessage}`);
        }
        const data: AuthResponse = await response.json();
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
