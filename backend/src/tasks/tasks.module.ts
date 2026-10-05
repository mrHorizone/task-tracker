import {Module} from '@nestjs/common';
import {TasksController} from './tasks.controller.js';
import {TasksService} from './tasks.service.js';
import {TasksGateway} from './tasks.gateway.js';
import {TaskExportService} from './export/task-export.service.js';
import {AuthModule} from '../auth/auth.module.js';

@Module({
    imports: [AuthModule],
    controllers: [TasksController],
    providers: [TasksService, TasksGateway, TaskExportService],
    exports: [TasksService, TasksGateway, TaskExportService],
})
export class TasksModule {
}
