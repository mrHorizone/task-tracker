import type {User} from "./user.ts";

export type Task = {
    id: number;
    title: string;
    text: string;
    status: Status;
    user?: User;
    authorId?: number | null;
    author?: User | null;
    createdAt?: string | Date;
    updatedById?: number | null;
    updatedBy?: User | null;
    updatedAt?: string | Date;
};

export enum Status {
    TODO = 'TODO',
    IN_PROGRESS = 'IN_PROGRESS',
    DONE = 'DONE',
}

export type TaskDeletedEvent = {
    id: number;
    title?: string;
    user?: User;
};

export type TaskLockInfo = {
    taskId: number;
    user: User;
};

export type TaskExportStartedEvent = {
    jobId: string;
    user?: User;
};

export type TaskExportCompletedEvent = {
    jobId: string;
    fileId: string;
    filename: string;
    count: number;
    user?: User;
};

export type TaskExportFailedEvent = {
    jobId: string;
    error: string;
    user?: User;
};