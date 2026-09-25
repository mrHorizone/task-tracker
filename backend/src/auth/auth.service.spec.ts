import {Test, TestingModule} from '@nestjs/testing';
import {ConflictException, UnauthorizedException} from '@nestjs/common';
import {JwtService} from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import {AuthService} from './auth.service.js';
import {PrismaService} from '../prisma/prisma.service.js';

describe('AuthService', () => {
    let service: AuthService;
    let prisma: {
        user: {
            create: ReturnType<typeof vi.fn>;
            findUnique: ReturnType<typeof vi.fn>;
        };
    };
    let jwtService: {
        signAsync: ReturnType<typeof vi.fn>;
    };

    beforeEach(async () => {
        prisma = {
            user: {
                create: vi.fn(),
                findUnique: vi.fn(),
            },
        };
        jwtService = {
            signAsync: vi.fn().mockResolvedValue('mocked-jwt-token'),
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                AuthService,
                {
                    provide: PrismaService,
                    useValue: prisma,
                },
                {
                    provide: JwtService,
                    useValue: jwtService,
                },
            ],
        }).compile();

        service = module.get<AuthService>(AuthService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('register', () => {
        it('should register a new user successfully and return token with user', async () => {
            const registerDto = {login: 'newuser', password: 'password123'};
            const createdUser = {id: 1, login: 'newuser', password: 'hashedpassword'};

            prisma.user.findUnique.mockResolvedValue(null);
            prisma.user.create.mockResolvedValue(createdUser);

            const result = await service.register(registerDto);
            expect(result).toEqual({
                accessToken: 'mocked-jwt-token',
                user: {id: 1, login: 'newuser'},
            });
            expect(prisma.user.findUnique).toHaveBeenCalledWith({
                where: {login: registerDto.login},
            });
            expect(prisma.user.create).toHaveBeenCalledWith({
                data: {
                    login: 'newuser',
                    password: expect.any(String),
                },
            });
            const createdPasswordArg = prisma.user.create.mock.calls[0][0].data.password;
            const isMatch = await bcrypt.compare('password123', createdPasswordArg);
            expect(isMatch).toBe(true);
            expect(jwtService.signAsync).toHaveBeenCalledWith({
                sub: 1,
                login: 'newuser',
            });
        });

        it('should throw ConflictException if user already exists', async () => {
            const registerDto = {login: 'existinguser', password: 'password123'};
            const existingUser = {id: 1, ...registerDto};

            prisma.user.findUnique.mockResolvedValue(existingUser);

            await expect(service.register(registerDto)).rejects.toThrow(
                ConflictException,
            );
            expect(prisma.user.create).not.toHaveBeenCalled();
        });
    });

    describe('login', () => {
        it('should return token and user when credentials are valid', async () => {
            const loginDto = {login: 'testuser', password: 'password123'};
            const hashedPassword = await bcrypt.hash('password123', 10);
            const existingUser = {id: 1, login: 'testuser', password: hashedPassword};

            prisma.user.findUnique.mockResolvedValue(existingUser);

            const result = await service.login(loginDto);
            expect(result).toEqual({
                accessToken: 'mocked-jwt-token',
                user: {id: 1, login: 'testuser'},
            });
            expect(prisma.user.findUnique).toHaveBeenCalledWith({
                where: {login: loginDto.login},
            });
            expect(jwtService.signAsync).toHaveBeenCalledWith({
                sub: 1,
                login: 'testuser',
            });
        });

        it('should throw UnauthorizedException when user does not exist', async () => {
            const loginDto = {login: 'unknownuser', password: 'password123'};

            prisma.user.findUnique.mockResolvedValue(null);

            await expect(service.login(loginDto)).rejects.toThrow(
                UnauthorizedException,
            );
        });

        it('should throw UnauthorizedException when password does not match', async () => {
            const loginDto = {login: 'testuser', password: 'wrongpassword'};
            const hashedPassword = await bcrypt.hash('correctpassword', 10);
            const existingUser = {
                id: 1,
                login: 'testuser',
                password: hashedPassword,
            };

            prisma.user.findUnique.mockResolvedValue(existingUser);

            await expect(service.login(loginDto)).rejects.toThrow(
                UnauthorizedException,
            );
        });
    });
});
