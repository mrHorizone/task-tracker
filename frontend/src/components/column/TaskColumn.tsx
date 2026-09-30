import {useState} from "react";
import type {Task, TaskEventUser} from "../../types/task.ts";
import {Status} from "../../types/status.ts";
import TaskItem from "../task/TaskItem.tsx";
import styles from "./TaskColumn.module.css";

const STATUS_TITLES: Record<Status, string> = {
    [Status.TODO]: "To Do",
    [Status.IN_PROGRESS]: "In Progress",
    [Status.DONE]: "Done",
};

type TaskColumnProps = {
    status: Status;
    tasks: Task[];
    lockedTasksMap?: Record<number, TaskEventUser>;
    onAddTask: (status: Status) => void;
    onDeleteTask: (id: number) => void;
    onSaveTask: (id: number, title: string, text: string) => void;
    onMoveTask: (id: number, status: Status) => void;
    onStartEditTask?: (id: number) => void;
    onStopEditTask?: (id: number) => void;
};

function TaskColumn({
                        status,
                        tasks,
                        lockedTasksMap = {},
                        onAddTask,
                        onDeleteTask,
                        onSaveTask,
                        onMoveTask,
                        onStartEditTask,
                        onStopEditTask,
                    }: TaskColumnProps) {
    const title = STATUS_TITLES[status] || status;
    const [isDragOver, setIsDragOver] = useState(false);

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
    };

    const handleDragEnter = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node)) {
            setIsDragOver(false);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(false);
        const taskId = Number(e.dataTransfer.getData("text/plain"));
        if (taskId) {
            if (lockedTasksMap[taskId]) {
                // Task is locked by another user, cannot move
                return;
            }
            onMoveTask(taskId, status);
        }
    };

    return (
        <div
            className={`${styles.column}${isDragOver ? ` ${styles.dragOver}` : ''}`}
            onDragOver={handleDragOver}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
        >
            <div className={styles.header}>
                <div className={styles.titleContainer}>
                    <span className={styles.count}>{tasks.length}</span>
                    <span className={styles.title}>{title}</span>
                </div>

                <button className="dashed" onClick={() => onAddTask(status)}>
                    + Add Task
                </button>
            </div>

            {tasks.length > 0 && (
                <div className={styles.tasksList}>
                    {tasks.map(task => (
                        <TaskItem
                            key={task.id}
                            task={task}
                            lockedByUser={lockedTasksMap[task.id]}
                            onDelete={onDeleteTask}
                            onSave={onSaveTask}
                            onStartEdit={onStartEditTask}
                            onStopEdit={onStopEditTask}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

export default TaskColumn;
