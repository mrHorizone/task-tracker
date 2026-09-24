import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';

describe('AuthController', () => {
  let controller: AuthController;
  let service: {
    register: ReturnType<typeof vi.fn>;
    login: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    service = {
      register: vi.fn(),
      login: vi.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: service,
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('register', () => {
    it('should call authService.register and return the result', async () => {
      const registerDto = { login: 'newuser', password: 'password123' };
      const user = { id: 1, ...registerDto };

      service.register.mockResolvedValue(user);

      const result = await controller.register(registerDto);
      expect(result).toEqual(user);
      expect(service.register).toHaveBeenCalledWith(registerDto);
    });
  });

  describe('login', () => {
    it('should call authService.login and return the result', async () => {
      const loginDto = { login: 'user', password: 'password123' };
      const user = { id: 1, ...loginDto };

      service.login.mockResolvedValue(user);

      const result = await controller.login(loginDto);
      expect(result).toEqual(user);
      expect(service.login).toHaveBeenCalledWith(loginDto);
    });
  });
});
