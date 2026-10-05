import {useState, useEffect, useRef} from "react";
import {useNavigate} from "react-router-dom";
import {toast} from "sonner";
import {taskService} from "../../services/taskService.ts";
import {socketService} from "../../services/socketService.ts";
import {authService} from "../../services/authService.ts";
import AppHeader from "../../components/header/AppHeader.tsx";
import TaskColumn from "../../components/column/TaskColumn.tsx";
import styles from "./TasksPage.module.css";
import {
    Status,
    type Task,
    type TaskDeletedEvent, type TaskExportCompletedEvent, type TaskExportFailedEvent,
    type TaskExportStartedEvent,
    type TaskLockInfo,
    type User
} from "../../types";

const COLUMNS = [Status.TODO, Status.IN_PROGRESS, Status.DONE];

function TasksPage() {
    const navigate = useNavigate();
    const [tasks, setTasks] = useState<Task[]>([]);
    const [lockedTasksMap, setLockedTasksMap] = useState<Record<number, User>>({});
    const [isExporting, setIsExporting] = useState(false);
    const tasksRef = useRef<Task[]>(tasks);

    useEffect(() => {
        tasksRef.current = tasks;
    }, [tasks]);

    useEffect(() => {
        const unsubscribeAuthError = socketService.onAuthError(() => {
            navigate('/login');
        });

        return () => {
            unsubscribeAuthError();
        };
    }, [navigate]);

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
                if (!authService.isAuthenticated()) {
                    navigate('/login');
                }
            });
    }, [navigate]);

    useEffect(() => {
        const socket = socketService.connect();
        const currentUser = authService.getUser();

        const handleActiveLocks = (locks: TaskLockInfo[]) => {
            const newMap: Record<number, User> = {};
            for (const lock of locks) {
                if (!currentUser || currentUser.id !== lock.user.id) {
                    newMap[lock.taskId] = lock.user;
                }
            }
            setLockedTasksMap(newMap);
        };

        const handleTaskLocked = ({taskId, user}: TaskLockInfo) => {
            if (user && (!currentUser || currentUser.id !== user.id)) {
                setLockedTasksMap(prev => ({...prev, [taskId]: user}));
            }
        };

        const handleTaskUnlocked = ({taskId}: {taskId: number}) => {
            setLockedTasksMap(prev => {
                const next = {...prev};
                delete next[taskId];
                return next;
            });
        };

        const handleTaskCreated = (newTask: Task) => {
            if (newTask.user && (!currentUser || currentUser.id !== newTask.user.id)) {
                toast.info(`${newTask.user.login} created task "${newTask.title}"`);
            }

            setTasks(prev => {
                if (prev.some(task => task.id === newTask.id)) {
                    return prev.map(task =>
                        task.id === newTask.id
                            ? {...newTask, status: newTask.status ?? Status.TODO}
                            : task
                    );
                }
                return [...prev, {...newTask, status: newTask.status ?? Status.TODO}];
            });
        };

        const handleTaskUpdated = (updatedTask: Task) => {
            if (updatedTask.user && (!currentUser || currentUser.id !== updatedTask.user.id)) {
                const existingTask = tasksRef.current.find(task => task.id === updatedTask.id);
                const isStatusOnlyChange =
                    existingTask &&
                    existingTask.status !== updatedTask.status &&
                    existingTask.title === updatedTask.title &&
                    existingTask.text === updatedTask.text;

                if (isStatusOnlyChange) {
                    toast.info(`${updatedTask.user.login} changed status of task "${updatedTask.title}" to ${updatedTask.status}`);
                } else {
                    toast.info(`${updatedTask.user.login} updated task "${updatedTask.title}"`);
                }
            }

            setTasks(prev =>
                prev.map(task =>
                    task.id === updatedTask.id
                        ? {...task, ...updatedTask, status: updatedTask.status ?? task.status ?? Status.TODO}
                        : task
                )
            );
        };

        const handleTaskDeleted = ({id, title, user}: TaskDeletedEvent) => {
            if (user && (!currentUser || currentUser.id !== user.id)) {
                toast.info(`${user.login} deleted task "${title || `ID ${id}`}"`);
            }

            setTasks(prev => prev.filter(task => task.id !== id));
        };

        const handleTaskExportStarted = (data: TaskExportStartedEvent) => {
            if (data.user && (!currentUser || currentUser.id !== data.user.id)) {
                toast.info(`${data.user.login} started exporting tasks to CSV`);
            }
        };

        const handleTaskExportCompleted = async (data: TaskExportCompletedEvent) => {
            const isInitiator = !data.user || (currentUser && currentUser.id === data.user.id);
            if (isInitiator) {
                toast.success(`CSV export completed! Exported ${data.count} tasks. Downloading file...`);
                setIsExporting(false);
                try {
                    await taskService.downloadExportFile(data.fileId, data.filename);
                } catch (error) {
                    console.error("Failed to automatically download exported CSV:", error);
                    toast.error("Failed to download CSV export file");
                }
            } else {
                toast.info(`${data.user?.login} finished exporting ${data.count} tasks to CSV`);
            }
        };

        const handleTaskExportFailed = (data: TaskExportFailedEvent) => {
            const isInitiator = !data.user || (currentUser && currentUser.id === data.user.id);
            if (isInitiator) {
                toast.error(`CSV export failed: ${data.error}`);
                setIsExporting(false);
            } else {
                toast.error(`CSV export failed for ${data.user?.login}: ${data.error}`);
            }
        };

        socket.on('activeLocks', handleActiveLocks);
        socket.on('taskLocked', handleTaskLocked);
        socket.on('taskUnlocked', handleTaskUnlocked);
        socket.on('taskCreated', handleTaskCreated);
        socket.on('taskUpdated', handleTaskUpdated);
        socket.on('taskDeleted', handleTaskDeleted);
        socket.on('taskExportStarted', handleTaskExportStarted);
        socket.on('taskExportCompleted', handleTaskExportCompleted);
        socket.on('taskExportFailed', handleTaskExportFailed);

        return () => {
            socket.off('activeLocks', handleActiveLocks);
            socket.off('taskLocked', handleTaskLocked);
            socket.off('taskUnlocked', handleTaskUnlocked);
            socket.off('taskCreated', handleTaskCreated);
            socket.off('taskUpdated', handleTaskUpdated);
            socket.off('taskDeleted', handleTaskDeleted);
            socket.off('taskExportStarted', handleTaskExportStarted);
            socket.off('taskExportCompleted', handleTaskExportCompleted);
            socket.off('taskExportFailed', handleTaskExportFailed);
        };
    }, []);

    const handleStartEditTask = (taskId: number) => {
        socketService.startEditTask(taskId);
    };

    const handleStopEditTask = (taskId: number) => {
        socketService.stopEditTask(taskId);
    };

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
                setTasks(prev => {
                    const alreadyExists = prev.some(task => task.id === createdTask.id);
                    if (alreadyExists) {
                        return prev.filter(task => task.id !== id);
                    }
                    return prev.map(task =>
                        task.id === id ? {...createdTask, status: createdTask.status ?? currentStatus} : task
                    );
                });
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

        if (lockedTasksMap[id]) {
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

    const handleExportCsv = async () => {
        try {
            setIsExporting(true);
            await taskService.exportTasksToCsv();
            toast.info("CSV export queued in background...");
        } catch (error) {
            console.error("Failed to trigger CSV export:", error);
            toast.error("Failed to queue CSV export");
            setIsExporting(false);
        }
    };

    return (
        <>
            <AppHeader onExportCsv={handleExportCsv} isExporting={isExporting}/>

            <main className={styles.mainContainer}>
                <div className={styles.board}>
                    {COLUMNS.map(status => (
                        <TaskColumn
                            key={status}
                            status={status}
                            tasks={tasks.filter(task => task.status === status)}
                            lockedTasksMap={lockedTasksMap}
                            onAddTask={addTask}
                            onDeleteTask={deleteTask}
                            onSaveTask={saveTask}
                            onMoveTask={moveTask}
                            onStartEditTask={handleStartEditTask}
                            onStopEditTask={handleStopEditTask}
                        />
                    ))}
                </div>
            </main>
        </>
    );
}

export default TasksPage;
