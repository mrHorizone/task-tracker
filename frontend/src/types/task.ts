import {Status} from "./status.ts";

export type TaskEventUser = {
    id: number;
    login: string;
};

export type Task = {
    id: number;
    title: string;
    text: string;
    status: Status;
    user?: TaskEventUser;
    authorId?: number | null;
    author?: TaskEventUser | null;
    createdAt?: string | Date;
    updatedById?: number | null;
    updatedBy?: TaskEventUser | null;
    updatedAt?: string | Date;
};

export type TaskDeletedEvent = {
    id: number;
    title?: string;
    user?: TaskEventUser;
};

export type TaskLockInfo = {
    taskId: number;
    user: TaskEventUser;
};

export {Status};