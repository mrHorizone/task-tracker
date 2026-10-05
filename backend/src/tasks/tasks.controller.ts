import {
    Controller,
    Get,
    Post,
    Put,
    Patch,
    Delete,
    Body,
    Param,
    Res,
    ParseIntPipe,
    HttpCode,
    HttpStatus,
    UseGuards,
    StreamableFile,
} from '@nestjs/common';
import type {Response} from 'express';
import * as fs from 'fs';
import {TasksService} from './tasks.service.js';
import {TaskExportService} from './export/task-export.service.js';
import {CreateTaskDto} from './dto/create-task.dto.js';
import {UpdateTaskDto} from './dto/update-task.dto.js';
import {JwtAuthGuard} from '../auth/jwt-auth.guard.js';
import {CurrentUser} from '../auth/decorators/current-user.decorator.js';
import type {TaskEventUser} from './tasks.gateway.js';

@Controller('tasks')
@UseGuards(JwtAuthGuard)
export class TasksController {
    constructor(
        private readonly tasksService: TasksService,
        private readonly taskExportService: TaskExportService,
    ) {
    }

    @Post()
    @HttpCode(HttpStatus.CREATED)
    create(@Body() createTaskDto: CreateTaskDto, @CurrentUser() user?: TaskEventUser) {
        return this.tasksService.create(createTaskDto, user);
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
        @CurrentUser() user?: TaskEventUser,
    ) {
        return this.tasksService.update(id, updateTaskDto, user);
    }

    @Patch(':id')
    patch(
        @Param('id', ParseIntPipe) id: number,
        @Body() updateTaskDto: UpdateTaskDto,
        @CurrentUser() user?: TaskEventUser,
    ) {
        return this.tasksService.update(id, updateTaskDto, user);
    }

    @Delete(':id')
    remove(@Param('id', ParseIntPipe) id: number, @CurrentUser() user?: TaskEventUser) {
        return this.tasksService.remove(id, user);
    }

    @Post('export/csv')
    @HttpCode(HttpStatus.ACCEPTED)
    exportTasks(@CurrentUser() user?: TaskEventUser) {
        return this.taskExportService.triggerExport(user);
    }

    @Get('export/:fileId')
    downloadExport(
        @Param('fileId') fileId: string,
        @Res({passthrough: true}) res: Response,
    ) {
        const {filePath, filename} = this.taskExportService.getExportFile(fileId);
        const fileStream = fs.createReadStream(filePath);
        res.set({
            'Content-Type': 'text/csv; charset=utf-8',
            'Content-Disposition': `attachment; filename="${filename}"`,
        });
        return new StreamableFile(fileStream);
    }
}
