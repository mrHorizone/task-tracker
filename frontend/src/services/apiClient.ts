import {authService} from "./authService.ts";

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export async function apiRequest<T = unknown>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const {headers: customHeaders, ...restOptions} = options;
    const token = authService.getToken();

    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...(token ? {'Authorization': `Bearer ${token}`} : {}),
        ...(customHeaders as Record<string, string>),
    };

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...restOptions,
        headers,
    });

    if (response.status === 401 && !endpoint.startsWith('/auth/')) {
        authService.logout();
        window.location.href = '/login';
        throw new Error('Unauthorized');
    }

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
            // ignore JSON parse failure
        }
        throw new Error(errorMessage || `Request failed with status ${response.status}`);
    }

    if (response.status === 204) {
        return {} as T;
    }

    return response.json();
}

export async function apiDownload(endpoint: string, filename: string): Promise<void> {
    const token = authService.getToken();
    const headers: Record<string, string> = {};
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        headers,
    });

    if (response.status === 401) {
        authService.logout();
        window.location.href = '/login';
        throw new Error('Unauthorized');
    }

    if (!response.ok) {
        throw new Error(`Failed to download file: ${response.statusText}`);
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
}
