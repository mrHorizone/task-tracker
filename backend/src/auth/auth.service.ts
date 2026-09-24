import {
  Injectable,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { RegisterDto } from './dto/register.dto.js';
import { LoginDto } from './dto/login.dto.js';
import { User } from '@prisma/client';

@Injectable()
export class AuthService {
  constructor(private readonly prisma: PrismaService) {}

  async register(registerDto: RegisterDto): Promise<User> {
    const existingUser = await this.prisma.user.findUnique({
      where: { login: registerDto.login },
    });

    if (existingUser) {
      throw new ConflictException('User with this login already exists');
    }

    return this.prisma.user.create({
      data: registerDto,
    });
  }

  async login(loginDto: LoginDto): Promise<User> {
    const user = await this.prisma.user.findUnique({
      where: { login: loginDto.login },
    });

    if (!user || user.password !== loginDto.password) {
      throw new UnauthorizedException('Invalid login or password');
    }

    return user;
  }
}
