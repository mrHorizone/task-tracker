import {
    WebSocketGateway,
    WebSocketServer,
    SubscribeMessage,
    ConnectedSocket,
    MessageBody,
    OnGatewayConnection,
    OnGatewayDisconnect,
} from '@nestjs/websockets';
import {Server, Socket} from 'socket.io';
import {JwtService} from '@nestjs/jwt';
import {Logger} from '@nestjs/common';
import {Task} from '@prisma/client';

export interface TaskEventUser {
    id: number;
    login: string;
}

export interface TaskLockInfo {
    taskId: number;
    user: TaskEventUser;
}

export interface TaskEventPayload extends Task {
    user?: TaskEventUser;
}

export interface TaskDeletedPayload {
    id: number;
    title?: string;
    user?: TaskEventUser;
}

export interface TaskExportStartedPayload {
    jobId: string;
    user?: TaskEventUser;
}

export interface TaskExportCompletedPayload {
    jobId: string;
    fileId: string;
    filename: string;
    count: number;
    user?: TaskEventUser;
}

export interface TaskExportFailedPayload {
    jobId: string;
    error: string;
    user?: TaskEventUser;
}

@WebSocketGateway({
    cors: {
        origin: '*',
    },
})
export class TasksGateway implements OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer()
    server: Server;

    private readonly logger = new Logger(TasksGateway.name);

    // taskId -> { socketId, user }
    private activeLocks = new Map<number, { socketId: string; user: TaskEventUser }>();

    constructor(private readonly jwtService: JwtService) {
    }

    async handleConnection(client: Socket) {
        try {
            const authHeader =
                client.handshake.auth?.token ||
                client.handshake.headers?.authorization;

            if (!authHeader) {
                this.logger.warn(`WS connection rejected: Missing authorization token for client ${client.id}`);
                client.emit('auth_error', {message: 'Missing authorization token'});
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

            // Send current active locks to the newly connected client
            const locksList = this.getActiveLocksList();
            client.emit('activeLocks', locksList);
        } catch {
            this.logger.warn(`WS connection rejected: Invalid token for client ${client.id}`);
            client.emit('auth_error', {message: 'Invalid token'});
            client.disconnect();
        }
    }

    handleDisconnect(client: Socket) {
        this.logger.log(`WS Client disconnected: ${client.id}`);
        // Release any locks held by this socket
        for (const [taskId, lock] of this.activeLocks.entries()) {
            if (lock.socketId === client.id) {
                this.activeLocks.delete(taskId);
                this.server?.emit('taskUnlocked', {taskId, user: lock.user});
            }
        }
    }

    @SubscribeMessage('startEditTask')
    handleStartEditTask(
        @ConnectedSocket() client: Socket,
        @MessageBody() data: { taskId: number }
    ) {
        const userPayload = client.data?.user;
        if (!userPayload || !data?.taskId) return;

        const user: TaskEventUser = {
            id: userPayload.sub || userPayload.id,
            login: userPayload.login,
        };

        const existingLock = this.activeLocks.get(data.taskId);
        if (existingLock && existingLock.socketId !== client.id) {
            // Task is already locked by someone else
            client.emit('taskLockFailed', {taskId: data.taskId, lockedBy: existingLock.user});
            return;
        }

        this.activeLocks.set(data.taskId, {socketId: client.id, user});
        this.server?.emit('taskLocked', {taskId: data.taskId, user});
    }

    @SubscribeMessage('stopEditTask')
    handleStopEditTask(
        @ConnectedSocket() client: Socket,
        @MessageBody() data: { taskId: number }
    ) {
        if (!data?.taskId) return;

        const existingLock = this.activeLocks.get(data.taskId);
        if (existingLock && existingLock.socketId === client.id) {
            this.activeLocks.delete(data.taskId);
            this.server?.emit('taskUnlocked', {taskId: data.taskId, user: existingLock.user});
        }
    }

    sendTaskCreated(task: Task, user?: TaskEventUser) {
        const payload: TaskEventPayload = user ? {...task, user} : task;
        this.server?.emit('taskCreated', payload);
    }

    sendTaskUpdated(task: Task, user?: TaskEventUser) {
        // If task was locked, release lock on save/update
        const existingLock = this.activeLocks.get(task.id);
        if (existingLock) {
            this.activeLocks.delete(task.id);
            this.server?.emit('taskUnlocked', {taskId: task.id, user: existingLock.user});
        }

        const payload: TaskEventPayload = user ? {...task, user} : task;
        this.server?.emit('taskUpdated', payload);
    }

    sendTaskDeleted(id: number, user?: TaskEventUser, title?: string) {
        // If task was locked, release lock
        const existingLock = this.activeLocks.get(id);
        if (existingLock) {
            this.activeLocks.delete(id);
            this.server?.emit('taskUnlocked', {taskId: id, user: existingLock.user});
        }

        const payload: TaskDeletedPayload = {id, ...(user ? {user} : {}), ...(title ? {title} : {})};
        this.server?.emit('taskDeleted', payload);
    }

    sendTaskExportStarted(jobId: string, user?: TaskEventUser) {
        const payload: TaskExportStartedPayload = {jobId, ...(user ? {user} : {})};
        this.server?.emit('taskExportStarted', payload);
    }

    sendTaskExportCompleted(payload: TaskExportCompletedPayload) {
        this.server?.emit('taskExportCompleted', payload);
    }

    sendTaskExportFailed(payload: TaskExportFailedPayload) {
        this.server?.emit('taskExportFailed', payload);
    }

    private getActiveLocksList(): TaskLockInfo[] {
        return Array.from(this.activeLocks.entries()).map(([taskId, lock]) => ({
            taskId,
            user: lock.user,
        }));
    }
}
