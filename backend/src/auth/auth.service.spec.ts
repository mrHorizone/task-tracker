import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service.js';
import { PrismaService } from '../prisma/prisma.service.js';

describe('AuthService', () => {
  let service: AuthService;
  let prisma: {
    user: {
      create: ReturnType<typeof vi.fn>;
      findUnique: ReturnType<typeof vi.fn>;
    };
  };

  beforeEach(async () => {
    prisma = {
      user: {
        create: vi.fn(),
        findUnique: vi.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: PrismaService,
          useValue: prisma,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('register', () => {
    it('should register a new user successfully', async () => {
      const registerDto = { login: 'newuser', password: 'password123' };
      const createdUser = { id: 1, ...registerDto };

      prisma.user.findUnique.mockResolvedValue(null);
      prisma.user.create.mockResolvedValue(createdUser);

      const result = await service.register(registerDto);
      expect(result).toEqual(createdUser);
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { login: registerDto.login },
      });
      expect(prisma.user.create).toHaveBeenCalledWith({
        data: registerDto,
      });
    });

    it('should throw ConflictException if user already exists', async () => {
      const registerDto = { login: 'existinguser', password: 'password123' };
      const existingUser = { id: 1, ...registerDto };

      prisma.user.findUnique.mockResolvedValue(existingUser);

      await expect(service.register(registerDto)).rejects.toThrow(
        ConflictException,
      );
      expect(prisma.user.create).not.toHaveBeenCalled();
    });
  });

  describe('login', () => {
    it('should return user when credentials are valid', async () => {
      const loginDto = { login: 'testuser', password: 'password123' };
      const existingUser = { id: 1, ...loginDto };

      prisma.user.findUnique.mockResolvedValue(existingUser);

      const result = await service.login(loginDto);
      expect(result).toEqual(existingUser);
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { login: loginDto.login },
      });
    });

    it('should throw UnauthorizedException when user does not exist', async () => {
      const loginDto = { login: 'unknownuser', password: 'password123' };

      prisma.user.findUnique.mockResolvedValue(null);

      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException when password does not match', async () => {
      const loginDto = { login: 'testuser', password: 'wrongpassword' };
      const existingUser = {
        id: 1,
        login: 'testuser',
        password: 'correctpassword',
      };

      prisma.user.findUnique.mockResolvedValue(existingUser);

      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });
});
