import {Test, TestingModule} from '@nestjs/testing';
import {JwtService} from '@nestjs/jwt';
import {TasksGateway} from './tasks.gateway.js';
import {Socket} from 'socket.io';
import {Task} from '@prisma/client';

describe('TasksGateway', () => {
    let gateway: TasksGateway;
    let jwtService: {
        verifyAsync: ReturnType<typeof vi.fn>;
    };

    beforeEach(async () => {
        jwtService = {
            verifyAsync: vi.fn(),
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                TasksGateway,
                {
                    provide: JwtService,
                    useValue: jwtService,
                },
            ],
        }).compile();

        gateway = module.get<TasksGateway>(TasksGateway);
        gateway.server = {
            emit: vi.fn(),
        } as any;
    });

    it('should be defined', () => {
        expect(gateway).toBeDefined();
    });

    describe('handleConnection', () => {
        it('should authenticate client with valid auth token in handshake.auth', async () => {
            const mockClient = {
                id: 'socket-1',
                handshake: {
                    auth: {token: 'valid-jwt-token'},
                    headers: {},
                },
                data: {},
                emit: vi.fn(),
                disconnect: vi.fn(),
            } as unknown as Socket;

            jwtService.verifyAsync.mockResolvedValue({sub: 1, login: 'testuser'});

            await gateway.handleConnection(mockClient);

            expect(jwtService.verifyAsync).toHaveBeenCalledWith('valid-jwt-token', expect.any(Object));
            expect(mockClient.data.user).toEqual({sub: 1, login: 'testuser'});
            expect(mockClient.emit).toHaveBeenCalledWith('activeLocks', []);
            expect(mockClient.disconnect).not.toHaveBeenCalled();
        });

        it('should handle Bearer prefix in authorization header', async () => {
            const mockClient = {
                id: 'socket-2',
                handshake: {
                    auth: {},
                    headers: {authorization: 'Bearer valid-bearer-token'},
                },
                data: {},
                emit: vi.fn(),
                disconnect: vi.fn(),
            } as unknown as Socket;

            jwtService.verifyAsync.mockResolvedValue({sub: 2, login: 'beareruser'});

            await gateway.handleConnection(mockClient);

            expect(jwtService.verifyAsync).toHaveBeenCalledWith('valid-bearer-token', expect.any(Object));
            expect(mockClient.data.user).toEqual({sub: 2, login: 'beareruser'});
            expect(mockClient.emit).toHaveBeenCalledWith('activeLocks', []);
            expect(mockClient.disconnect).not.toHaveBeenCalled();
        });

        it('should disconnect client when auth token is missing', async () => {
            const mockClient = {
                id: 'socket-3',
                handshake: {
                    auth: {},
                    headers: {},
                },
                data: {},
                emit: vi.fn(),
                disconnect: vi.fn(),
            } as unknown as Socket;

            await gateway.handleConnection(mockClient);

            expect(mockClient.emit).toHaveBeenCalledWith('auth_error', {message: 'Missing authorization token'});
            expect(mockClient.disconnect).toHaveBeenCalled();
            expect(jwtService.verifyAsync).not.toHaveBeenCalled();
        });

        it('should disconnect client when token verification fails', async () => {
            const mockClient = {
                id: 'socket-4',
                handshake: {
                    auth: {token: 'invalid-token'},
                    headers: {},
                },
                data: {},
                emit: vi.fn(),
                disconnect: vi.fn(),
            } as unknown as Socket;

            jwtService.verifyAsync.mockRejectedValue(new Error('Invalid token'));

            await gateway.handleConnection(mockClient);

            expect(mockClient.emit).toHaveBeenCalledWith('auth_error', {message: 'Invalid token'});
            expect(mockClient.disconnect).toHaveBeenCalled();
        });
    });

    describe('events', () => {
        const sampleTask: Task = {
            id: 1,
            title: 'Test Task',
            text: 'Details',
            status: 'TODO' as any,
        };

        it('should emit taskCreated event', () => {
            gateway.sendTaskCreated(sampleTask);
            expect(gateway.server.emit).toHaveBeenCalledWith('taskCreated', sampleTask);

            const user = {id: 2, login: 'alice'};
            gateway.sendTaskCreated(sampleTask, user);
            expect(gateway.server.emit).toHaveBeenCalledWith('taskCreated', {...sampleTask, user});
        });

        it('should emit taskUpdated event', () => {
            gateway.sendTaskUpdated(sampleTask);
            expect(gateway.server.emit).toHaveBeenCalledWith('taskUpdated', sampleTask);

            const user = {id: 2, login: 'alice'};
            gateway.sendTaskUpdated(sampleTask, user);
            expect(gateway.server.emit).toHaveBeenCalledWith('taskUpdated', {...sampleTask, user});
        });

        it('should emit taskDeleted event', () => {
            gateway.sendTaskDeleted(1);
            expect(gateway.server.emit).toHaveBeenCalledWith('taskDeleted', {id: 1});

            const user = {id: 2, login: 'alice'};
            gateway.sendTaskDeleted(1, user, 'Test Task');
            expect(gateway.server.emit).toHaveBeenCalledWith('taskDeleted', {id: 1, user, title: 'Test Task'});
        });
    });

    describe('task locks', () => {
        it('should lock task when startEditTask is received', () => {
            const mockClient = {
                id: 'socket-1',
                data: {user: {sub: 5, login: 'bob'}},
                emit: vi.fn(),
            } as unknown as Socket;

            gateway.handleStartEditTask(mockClient, {taskId: 10});

            expect(gateway.server.emit).toHaveBeenCalledWith('taskLocked', {
                taskId: 10,
                user: {id: 5, login: 'bob'},
            });
        });

        it('should fail to lock if task already locked by another client', () => {
            const mockClient1 = {
                id: 'socket-1',
                data: {user: {sub: 5, login: 'bob'}},
                emit: vi.fn(),
            } as unknown as Socket;

            const mockClient2 = {
                id: 'socket-2',
                data: {user: {sub: 6, login: 'alice'}},
                emit: vi.fn(),
            } as unknown as Socket;

            gateway.handleStartEditTask(mockClient1, {taskId: 10});
            gateway.handleStartEditTask(mockClient2, {taskId: 10});

            expect(mockClient2.emit).toHaveBeenCalledWith('taskLockFailed', {
                taskId: 10,
                lockedBy: {id: 5, login: 'bob'},
            });
        });

        it('should unlock task when stopEditTask is received', () => {
            const mockClient = {
                id: 'socket-1',
                data: {user: {sub: 5, login: 'bob'}},
                emit: vi.fn(),
            } as unknown as Socket;

            gateway.handleStartEditTask(mockClient, {taskId: 10});
            gateway.handleStopEditTask(mockClient, {taskId: 10});

            expect(gateway.server.emit).toHaveBeenCalledWith('taskUnlocked', {
                taskId: 10,
                user: {id: 5, login: 'bob'},
            });
        });

        it('should unlock tasks when client disconnects', () => {
            const mockClient = {
                id: 'socket-1',
                data: {user: {sub: 5, login: 'bob'}},
                emit: vi.fn(),
            } as unknown as Socket;

            gateway.handleStartEditTask(mockClient, {taskId: 10});
            gateway.handleDisconnect(mockClient);

            expect(gateway.server.emit).toHaveBeenCalledWith('taskUnlocked', {
                taskId: 10,
                user: {id: 5, login: 'bob'},
            });
        });
    });
});
