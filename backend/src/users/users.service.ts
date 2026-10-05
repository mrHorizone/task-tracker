import {Injectable, NotFoundException} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import {PrismaService} from '../prisma/prisma.service.js';
import {CreateUserDto} from './dto/create-user.dto.js';
import {UpdateUserDto} from './dto/update-user.dto.js';
import {User} from '@prisma/client';

export type UserWithoutPassword = Omit<User, 'password'>;

const USER_SELECT_FIELDS = {
    id: true,
    login: true,
} as const;

const SALT_ROUNDS = 10;

@Injectable()
export class UsersService {
    constructor(private readonly prisma: PrismaService) {
    }

    async create(createUserDto: CreateUserDto): Promise<UserWithoutPassword> {
        const hashedPassword = await bcrypt.hash(createUserDto.password, SALT_ROUNDS);
        return this.prisma.user.create({
            data: {
                login: createUserDto.login,
                password: hashedPassword,
            },
            select: USER_SELECT_FIELDS,
        });
    }

    async findAll(): Promise<UserWithoutPassword[]> {
        return this.prisma.user.findMany({
            select: USER_SELECT_FIELDS,
            orderBy: {id: 'asc'},
        });
    }

    async findOne(id: number): Promise<UserWithoutPassword> {
        const user = await this.prisma.user.findUnique({
            where: {id},
            select: USER_SELECT_FIELDS,
        });
        if (!user) {
            throw new NotFoundException(`User with ID ${id} not found`);
        }
        return user;
    }

    async update(id: number, updateUserDto: UpdateUserDto): Promise<UserWithoutPassword> {
        await this.findOne(id);
        const data: { login?: string; password?: string } = {};
        if (updateUserDto.login !== undefined) {
            data.login = updateUserDto.login;
        }
        if (updateUserDto.password) {
            data.password = await bcrypt.hash(updateUserDto.password, SALT_ROUNDS);
        }
        return this.prisma.user.update({
            where: {id},
            data,
            select: USER_SELECT_FIELDS,
        });
    }

    async remove(id: number): Promise<{ success: boolean; id: number }> {
        await this.findOne(id);
        await this.prisma.user.delete({
            where: {id},
        });
        return {success: true, id};
    }
}
