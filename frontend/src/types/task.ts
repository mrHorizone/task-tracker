import {Status} from "./status.ts";

export type Task = {
    id: number
    title: string
    text: string
    status: Status
}

export {Status};