import { Test, TestingModule } from '@nestjs/testing';
import { TasksController } from './tasks.controller.js';
import { TasksService } from './tasks.service.js';

describe('TasksController', () => {
  let controller: TasksController;
  let service: {
    create: ReturnType<typeof vi.fn>;
    findAll: ReturnType<typeof vi.fn>;
    findOne: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
    remove: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    service = {
      create: vi.fn(),
      findAll: vi.fn(),
      findOne: vi.fn(),
      update: vi.fn(),
      remove: vi.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [TasksController],
      providers: [
        {
          provide: TasksService,
          useValue: service,
        },
      ],
    }).compile();

    controller = module.get<TasksController>(TasksController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a task', async () => {
      const dto = { title: 'Task', text: 'Desc' };
      const created = { id: 1, ...dto };
      service.create.mockResolvedValue(created);

      const result = await controller.create(dto);
      expect(result).toEqual(created);
      expect(service.create).toHaveBeenCalledWith(dto);
    });
  });

  describe('findAll', () => {
    it('should return all tasks', async () => {
      const tasks = [{ id: 1, title: 'Task 1', text: 'Desc 1' }];
      service.findAll.mockResolvedValue(tasks);

      const result = await controller.findAll();
      expect(result).toEqual(tasks);
      expect(service.findAll).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return a task by id', async () => {
      const task = { id: 1, title: 'Task 1', text: 'Desc 1' };
      service.findOne.mockResolvedValue(task);

      const result = await controller.findOne(1);
      expect(result).toEqual(task);
      expect(service.findOne).toHaveBeenCalledWith(1);
    });
  });

  describe('update', () => {
    it('should update a task', async () => {
      const dto = { title: 'Updated' };
      const updated = { id: 1, title: 'Updated', text: 'Desc' };
      service.update.mockResolvedValue(updated);

      const result = await controller.update(1, dto);
      expect(result).toEqual(updated);
      expect(service.update).toHaveBeenCalledWith(1, dto);
    });
  });

  describe('remove', () => {
    it('should delete a task', async () => {
      service.remove.mockResolvedValue({ success: true, id: 1 });

      const result = await controller.remove(1);
      expect(result).toEqual({ success: true, id: 1 });
      expect(service.remove).toHaveBeenCalledWith(1);
    });
  });
});
