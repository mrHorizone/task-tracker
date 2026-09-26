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
                disconnect: vi.fn(),
            } as unknown as Socket;

            jwtService.verifyAsync.mockResolvedValue({sub: 1, login: 'testuser'});

            await gateway.handleConnection(mockClient);

            expect(jwtService.verifyAsync).toHaveBeenCalledWith('valid-jwt-token', expect.any(Object));
            expect(mockClient.data.user).toEqual({sub: 1, login: 'testuser'});
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
                disconnect: vi.fn(),
            } as unknown as Socket;

            jwtService.verifyAsync.mockResolvedValue({sub: 2, login: 'beareruser'});

            await gateway.handleConnection(mockClient);

            expect(jwtService.verifyAsync).toHaveBeenCalledWith('valid-bearer-token', expect.any(Object));
            expect(mockClient.data.user).toEqual({sub: 2, login: 'beareruser'});
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
                disconnect: vi.fn(),
            } as unknown as Socket;

            await gateway.handleConnection(mockClient);

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
                disconnect: vi.fn(),
            } as unknown as Socket;

            jwtService.verifyAsync.mockRejectedValue(new Error('Invalid token'));

            await gateway.handleConnection(mockClient);

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
        });

        it('should emit taskUpdated event', () => {
            gateway.sendTaskUpdated(sampleTask);
            expect(gateway.server.emit).toHaveBeenCalledWith('taskUpdated', sampleTask);
        });

        it('should emit taskDeleted event', () => {
            gateway.sendTaskDeleted(1);
            expect(gateway.server.emit).toHaveBeenCalledWith('taskDeleted', {id: 1});
        });
    });
});
