import {createParamDecorator, ExecutionContext} from '@nestjs/common';
import type {TaskEventUser} from '../../tasks/tasks.gateway.js';

export const CurrentUser = createParamDecorator(
    (data: unknown, ctx: ExecutionContext): TaskEventUser | undefined => {
        const request = ctx.switchToHttp().getRequest();
        return request.user;
    },
);
