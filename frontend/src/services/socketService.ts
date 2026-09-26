import {io, Socket} from 'socket.io-client';
import {authService} from './authService.ts';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

class SocketService {
    private socket: Socket | null = null;

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
}

export const socketService = new SocketService();
