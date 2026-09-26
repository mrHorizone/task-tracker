import {
    WebSocketGateway,
    WebSocketServer,
    OnGatewayConnection,
    OnGatewayDisconnect,
} from '@nestjs/websockets';
import {Server, Socket} from 'socket.io';
import {JwtService} from '@nestjs/jwt';
import {Logger} from '@nestjs/common';
import {Task} from '@prisma/client';

@WebSocketGateway({
    cors: {
        origin: '*',
    },
})
export class TasksGateway implements OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer()
    server: Server;

    private readonly logger = new Logger(TasksGateway.name);

    constructor(private readonly jwtService: JwtService) {
    }

    async handleConnection(client: Socket) {
        try {
            const authHeader =
                client.handshake.auth?.token ||
                client.handshake.headers?.authorization;

            if (!authHeader) {
                this.logger.warn(`WS connection rejected: Missing authorization token for client ${client.id}`);
                client.disconnect();
                return;
            }

            const token = typeof authHeader === 'string' && authHeader.startsWith('Bearer ')
                ? authHeader.slice(7)
                : authHeader;

            const payload = await this.jwtService.verifyAsync(token, {
                secret: process.env.JWT_SECRET || 'jwt-secret-task-tracker-default',
            });

            client.data.user = payload;
            this.logger.log(`WS Client connected: ${client.id} (User: ${payload.login})`);
        } catch {
            this.logger.warn(`WS connection rejected: Invalid token for client ${client.id}`);
            client.disconnect();
        }
    }

    handleDisconnect(client: Socket) {
        this.logger.log(`WS Client disconnected: ${client.id}`);
    }

    sendTaskCreated(task: Task) {
        this.server?.emit('taskCreated', task);
    }

    sendTaskUpdated(task: Task) {
        this.server?.emit('taskUpdated', task);
    }

    sendTaskDeleted(id: number) {
        this.server?.emit('taskDeleted', {id});
    }
}
