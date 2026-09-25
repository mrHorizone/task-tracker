import {Global, Module} from '@nestjs/common';
import {JwtModule} from '@nestjs/jwt';
import {PassportModule} from '@nestjs/passport';
import {AuthController} from './auth.controller.js';
import {AuthService} from './auth.service.js';
import {JwtStrategy} from './jwt.strategy.js';
import {JwtAuthGuard} from './jwt-auth.guard.js';

@Global()
@Module({
    imports: [
        PassportModule.register({defaultStrategy: 'jwt'}),
        JwtModule.register({
            global: true,
            secret: process.env.JWT_SECRET || 'jwt-secret-task-tracker-default',
            signOptions: {expiresIn: '1d'},
        }),
    ],
    controllers: [AuthController],
    providers: [AuthService, JwtStrategy, JwtAuthGuard],
    exports: [AuthService, JwtAuthGuard, JwtModule, PassportModule],
})
export class AuthModule {
}
