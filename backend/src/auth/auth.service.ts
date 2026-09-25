import {
    Injectable,
    ConflictException,
    UnauthorizedException,
} from '@nestjs/common';
import {JwtService} from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import {PrismaService} from '../prisma/prisma.service.js';
import {RegisterDto} from './dto/register.dto.js';
import {LoginDto} from './dto/login.dto.js';
import {AuthResult} from './interfaces/auth-result.interface.js';

const SALT_ROUNDS = 10;

@Injectable()
export class AuthService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly jwtService: JwtService,
    ) {
    }

    async register(registerDto: RegisterDto): Promise<AuthResult> {
        const existingUser = await this.prisma.user.findUnique({
            where: {login: registerDto.login},
        });

        if (existingUser) {
            throw new ConflictException('User with this login already exists');
        }

        const hashedPassword = await bcrypt.hash(registerDto.password, SALT_ROUNDS);

        const user = await this.prisma.user.create({
            data: {
                login: registerDto.login,
                password: hashedPassword,
            },
        });

        const payload = {sub: user.id, login: user.login};
        const accessToken = await this.jwtService.signAsync(payload);

        return {
            accessToken,
            user: {
                id: user.id,
                login: user.login,
            },
        };
    }

    async login(loginDto: LoginDto): Promise<AuthResult> {
        const user = await this.prisma.user.findUnique({
            where: {login: loginDto.login},
        });

        if (!user) {
            throw new UnauthorizedException('Invalid login or password');
        }

        const isPasswordValid = await bcrypt.compare(loginDto.password, user.password);
        if (!isPasswordValid) {
            throw new UnauthorizedException('Invalid login or password');
        }

        const payload = {sub: user.id, login: user.login};
        const accessToken = await this.jwtService.signAsync(payload);

        return {
            accessToken,
            user: {
                id: user.id,
                login: user.login,
            },
        };
    }
}
