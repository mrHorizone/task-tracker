import {
    Controller,
    Get,
    Post,
    Put,
    Patch,
    Delete,
    Body,
    Param,
    Req,
    ParseIntPipe,
    HttpCode,
    HttpStatus,
    UseGuards,
} from '@nestjs/common';
import {TasksService} from './tasks.service.js';
import {CreateTaskDto} from './dto/create-task.dto.js';
import {UpdateTaskDto} from './dto/update-task.dto.js';
import {JwtAuthGuard} from '../auth/jwt-auth.guard.js';

@Controller('tasks')
@UseGuards(JwtAuthGuard)
export class TasksController {
    constructor(private readonly tasksService: TasksService) {
    }

    @Post()
    @HttpCode(HttpStatus.CREATED)
    create(@Body() createTaskDto: CreateTaskDto, @Req() req: any) {
        return this.tasksService.create(createTaskDto, req?.user);
    }

    @Get()
    findAll() {
        return this.tasksService.findAll();
    }

    @Get(':id')
    findOne(@Param('id', ParseIntPipe) id: number) {
        return this.tasksService.findOne(id);
    }

    @Put(':id')
    update(
        @Param('id', ParseIntPipe) id: number,
        @Body() updateTaskDto: UpdateTaskDto,
        @Req() req: any,
    ) {
        return this.tasksService.update(id, updateTaskDto, req?.user);
    }

    @Patch(':id')
    patch(
        @Param('id', ParseIntPipe) id: number,
        @Body() updateTaskDto: UpdateTaskDto,
        @Req() req: any,
    ) {
        return this.tasksService.update(id, updateTaskDto, req?.user);
    }

    @Delete(':id')
    remove(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
        return this.tasksService.remove(id, req?.user);
    }
}
