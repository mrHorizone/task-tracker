import {Test, TestingModule} from '@nestjs/testing';
import {NotFoundException} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import {UsersService} from './users.service.js';
import {PrismaService} from '../prisma/prisma.service.js';

describe('UsersService', () => {
    let service: UsersService;
    let prisma: {
        user: {
            create: ReturnType<typeof vi.fn>;
            findMany: ReturnType<typeof vi.fn>;
            findUnique: ReturnType<typeof vi.fn>;
            update: ReturnType<typeof vi.fn>;
            delete: ReturnType<typeof vi.fn>;
        };
    };

    beforeEach(async () => {
        prisma = {
            user: {
                create: vi.fn(),
                findMany: vi.fn(),
                findUnique: vi.fn(),
                update: vi.fn(),
                delete: vi.fn(),
            },
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                UsersService,
                {
                    provide: PrismaService,
                    useValue: prisma,
                },
            ],
        }).compile();

        service = module.get<UsersService>(UsersService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('create', () => {
        it('should create a user with hashed password and return user without password', async () => {
            const dto = {login: 'testuser', password: 'password123'};
            const createdUser = {id: 1, login: 'testuser'};
            prisma.user.create.mockResolvedValue(createdUser);

            const result = await service.create(dto);
            expect(result).toEqual(createdUser);
            expect(prisma.user.create).toHaveBeenCalledWith({
                data: {
                    login: 'testuser',
                    password: expect.any(String),
                },
                select: {
                    id: true,
                    login: true,
                },
            });
            const createdPasswordArg = prisma.user.create.mock.calls[0][0].data.password;
            const isMatch = await bcrypt.compare('password123', createdPasswordArg);
            expect(isMatch).toBe(true);
        });
    });

    describe('findAll', () => {
        it('should return an array of users without passwords', async () => {
            const users = [
                {id: 1, login: 'user1'},
                {id: 2, login: 'user2'},
            ];
            prisma.user.findMany.mockResolvedValue(users);

            const result = await service.findAll();
            expect(result).toEqual(users);
            expect(prisma.user.findMany).toHaveBeenCalledWith({
                select: {
                    id: true,
                    login: true,
                },
                orderBy: {id: 'asc'},
            });
        });
    });

    describe('findOne', () => {
        it('should return a user if found', async () => {
            const user = {id: 1, login: 'user1'};
            prisma.user.findUnique.mockResolvedValue(user);

            const result = await service.findOne(1);
            expect(result).toEqual(user);
            expect(prisma.user.findUnique).toHaveBeenCalledWith({
                where: {id: 1},
                select: {
                    id: true,
                    login: true,
                },
            });
        });

        it('should throw NotFoundException if user not found', async () => {
            prisma.user.findUnique.mockResolvedValue(null);

            await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
        });
    });

    describe('update', () => {
        it('should update and return a user without password', async () => {
            const existingUser = {id: 1, login: 'user1'};
            const updateDto = {login: 'newlogin'};
            const updatedUser = {id: 1, login: 'newlogin'};

            prisma.user.findUnique.mockResolvedValue(existingUser);
            prisma.user.update.mockResolvedValue(updatedUser);

            const result = await service.update(1, updateDto);
            expect(result).toEqual(updatedUser);
            expect(prisma.user.update).toHaveBeenCalledWith({
                where: {id: 1},
                data: updateDto,
                select: {
                    id: true,
                    login: true,
                },
            });
        });

        it('should hash password when updating password', async () => {
            const existingUser = {id: 1, login: 'user1'};
            const updateDto = {password: 'newpassword123'};
            const updatedUser = {id: 1, login: 'user1'};

            prisma.user.findUnique.mockResolvedValue(existingUser);
            prisma.user.update.mockResolvedValue(updatedUser);

            const result = await service.update(1, updateDto);
            expect(result).toEqual(updatedUser);
            const updatedPasswordArg = prisma.user.update.mock.calls[0][0].data.password;
            const isMatch = await bcrypt.compare('newpassword123', updatedPasswordArg);
            expect(isMatch).toBe(true);
        });

        it('should throw NotFoundException if user to update does not exist', async () => {
            prisma.user.findUnique.mockResolvedValue(null);

            await expect(service.update(999, {login: 'new'})).rejects.toThrow(
                NotFoundException,
            );
        });
    });

    describe('remove', () => {
        it('should delete a user and return success', async () => {
            const existingUser = {id: 1, login: 'user1', password: 'pwd1'};
            prisma.user.findUnique.mockResolvedValue(existingUser);
            prisma.user.delete.mockResolvedValue(existingUser);

            const result = await service.remove(1);
            expect(result).toEqual({success: true, id: 1});
            expect(prisma.user.delete).toHaveBeenCalledWith({where: {id: 1}});
        });

        it('should throw NotFoundException if user to delete does not exist', async () => {
            prisma.user.findUnique.mockResolvedValue(null);

            await expect(service.remove(999)).rejects.toThrow(NotFoundException);
        });
    });
});
