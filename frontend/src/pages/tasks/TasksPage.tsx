import {useState, useEffect} from "react";
import {Status, type Task} from "../../types/task.ts";
import {taskService} from "../../services/taskService.ts";
import AppHeader from "../../components/header/AppHeader.tsx";
import TaskColumn from "../../components/column/TaskColumn.tsx";
import styles from "./TasksPage.module.css";

const COLUMNS = [Status.TODO, Status.IN_PROGRESS, Status.DONE];

function TasksPage() {
    const [tasks, setTasks] = useState<Task[]>([]);

    useEffect(() => {
        taskService.getTasks()
            .then(data => {
                if (Array.isArray(data)) {
                    setTasks(data.map(task => ({
                        ...task,
                        status: task.status ?? Status.TODO
                    })));
                }
            })
            .catch(error => {
                console.error("Failed to fetch tasks from backend:", error);
            });
    }, []);

    const addTask = (status: Status = Status.TODO) => {
        const newTask: Task = {
            id: Date.now(),
            title: '',
            text: '',
            status
        };

        setTasks(prev => [...prev, newTask]);
    };

    const deleteTask = async (id: number) => {
        const taskToDelete = tasks.find(task => task.id === id);
        if (taskToDelete && !taskToDelete.title) {
            setTasks(prev => prev.filter(task => task.id !== id));
            return;
        }

        try {
            await taskService.deleteTask(id);
            setTasks(prev => prev.filter(task => task.id !== id));
        } catch (error) {
            console.error("Failed to delete task:", error);
        }
    };

    const saveTask = async (id: number, title: string, text: string) => {
        const existingTask = tasks.find(task => task.id === id);
        const isCreating = existingTask && !existingTask.title;
        const currentStatus = existingTask?.status ?? Status.TODO;

        try {
            if (isCreating) {
                const createdTask = await taskService.createTask({title, text, status: currentStatus});
                setTasks(prev =>
                    prev.map(task =>
                        task.id === id ? {...createdTask, status: createdTask.status ?? currentStatus} : task
                    )
                );
            } else {
                const updatedTask = await taskService.updateTask(id, {title, text, status: currentStatus});
                setTasks(prev =>
                    prev.map(task =>
                        task.id === id ? {...updatedTask, status: updatedTask.status ?? currentStatus} : task
                    )
                );
            }
        } catch (error) {
            console.error("Failed to save task:", error);
        }
    };

    const moveTask = async (id: number, targetStatus: Status) => {
        const existingTask = tasks.find(task => task.id === id);
        if (!existingTask || existingTask.status === targetStatus) {
            return;
        }

        setTasks(prev =>
            prev.map(task =>
                task.id === id ? {...task, status: targetStatus} : task
            )
        );

        if (existingTask.title) {
            try {
                await taskService.updateTask(id, {status: targetStatus});
            } catch (error) {
                console.error("Failed to update task status in db:", error);
                setTasks(prev =>
                    prev.map(task =>
                        task.id === id ? {...task, status: existingTask.status} : task
                    )
                );
            }
        }
    };

    return (
        <>
            <AppHeader/>

            <main className={styles.mainContainer}>
                <div className={styles.board}>
                    {COLUMNS.map(status => (
                        <TaskColumn
                            key={status}
                            status={status}
                            tasks={tasks.filter(task => task.status === status)}
                            onAddTask={addTask}
                            onDeleteTask={deleteTask}
                            onSaveTask={saveTask}
                            onMoveTask={moveTask}
                        />
                    ))}
                </div>
            </main>
        </>
    );
}

export default TasksPage;
