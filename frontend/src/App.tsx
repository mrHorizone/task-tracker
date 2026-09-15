import './App.css'
import {useState, useEffect} from "react";
import type {Task} from "./types/task.ts";
import Header from "./components/header/Header.tsx";
import TaskItem from "./components/task/TaskItem.tsx";
import {taskService} from "./services/taskService.ts";

function App() {

    const [tasks, setTasks] = useState<Task[]>([])

    useEffect(() => {
        taskService.getTasks()
            .then(data => {
                if (Array.isArray(data)) {
                    setTasks(data);
                }
            })
            .catch(error => {
                console.error("Failed to fetch tasks from backend:", error);
            });
    }, []);

    const addTask = () => {
        const newTask: Task = {
            id: Date.now(),
            title: '',
            text: ''
        }

        setTasks(prev => [...prev, newTask])
    }

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
    }

    const saveTask = async (id: number, title: string, text: string) => {
        const existingTask = tasks.find(task => task.id === id);
        const isCreating = existingTask && !existingTask.title;

        try {
            if (isCreating) {
                const createdTask = await taskService.createTask({ title, text });
                setTasks(prev =>
                    prev.map(task =>
                        task.id === id ? createdTask : task
                    )
                );
            } else {
                const updatedTask = await taskService.updateTask(id, { title, text });
                setTasks(prev =>
                    prev.map(task =>
                        task.id === id ? updatedTask : task
                    )
                );
            }
        } catch (error) {
            console.error("Failed to save task:", error);
        }
    }

    return (
        <>
            <Header/>

            <main className="main-container">
                <button className="addTask" onClick={addTask}>Add Task</button>

                {tasks.length > 0 && (
                    <div className="tasks">
                        {tasks.map(task => (
                            <TaskItem
                                key={task.id}
                                task={task}
                                onDelete={deleteTask}
                                onSave={saveTask}
                            />
                        ))}
                    </div>
                )}

            </main>
        </>
    )
}

export default App
