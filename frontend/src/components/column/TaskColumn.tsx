import {useState} from "react";
import type {Task} from "../../types/task.ts";
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
    onAddTask: (status: Status) => void;
    onDeleteTask: (id: number) => void;
    onSaveTask: (id: number, title: string, text: string) => void;
    onMoveTask: (id: number, status: Status) => void;
};

function TaskColumn({status, tasks, onAddTask, onDeleteTask, onSaveTask, onMoveTask}: TaskColumnProps) {
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
                            onDelete={onDeleteTask}
                            onSave={onSaveTask}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

export default TaskColumn;
