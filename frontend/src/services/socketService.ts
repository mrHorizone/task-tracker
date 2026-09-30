import {io, Socket} from 'socket.io-client';
import {authService} from './authService.ts';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

class SocketService {
    private socket: Socket | null = null;
    private authErrorCallback: (() => void) | null = null;

    onAuthError(callback: () => void): () => void {
        this.authErrorCallback = callback;
        return () => {
            if (this.authErrorCallback === callback) {
                this.authErrorCallback = null;
            }
        };
    }

    getSocket(): Socket {
        if (!this.socket) {
            this.socket = io(API_BASE_URL, {
                autoConnect: true,
                auth: (cb) => {
                    cb({
                        token: authService.getToken(),
                    });
                },
            });

            this.socket.on('auth_error', () => {
                authService.logout();
                if (this.authErrorCallback) {
                    this.authErrorCallback();
                } else {
                    window.location.href = '/login';
                }
            });

            this.socket.on('connect_error', (error) => {
                if (
                    error?.message?.toLowerCase().includes('token') ||
                    error?.message?.toLowerCase().includes('unauthorized') ||
                    error?.message?.toLowerCase().includes('auth')
                ) {
                    authService.logout();
                    if (this.authErrorCallback) {
                        this.authErrorCallback();
                    } else {
                        window.location.href = '/login';
                    }
                }
            });
        }
        return this.socket;
    }

    connect(): Socket {
        const socket = this.getSocket();
        if (socket.disconnected) {
            socket.connect();
        }
        return socket;
    }

    disconnect(): void {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
        }
    }

    startEditTask(taskId: number): void {
        const socket = this.getSocket();
        socket.emit('startEditTask', {taskId});
    }

    stopEditTask(taskId: number): void {
        const socket = this.getSocket();
        socket.emit('stopEditTask', {taskId});
    }
}

export const socketService = new SocketService();
