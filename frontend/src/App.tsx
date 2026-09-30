import {BrowserRouter, Routes, Route, Navigate} from 'react-router-dom';
import {Toaster} from 'sonner';
import LoginPage from "./pages/login/LoginPage.tsx";
import RegisterPage from "./pages/register/RegisterPage.tsx";
import TasksPage from "./pages/tasks/TasksPage.tsx";
import {ProtectedRoute} from "./components/ProtectedRoute.tsx";

function App() {
    return (
        <BrowserRouter>
            <Toaster
                position="bottom-left"
                theme="system"
                closeButton={true}
                duration={5000}
                toastOptions={{
                    style: {
                        background: 'var(--bg)',
                        color: 'var(--text)',
                        border: 'var(--border-width) solid var(--border-color)',
                        borderRadius: 'var(--border-radius)',
                        fontFamily: 'var(--sans)',
                        boxShadow: 'var(--shadow)',
                        padding: 'var(--component-padding)',
                        gap: 'var(--base-gap)',
                    },
                }}
            />
            <Routes>
                <Route path="/login" element={<LoginPage/>}/>
                <Route path="/register" element={<RegisterPage/>}/>
                <Route
                    path="/tasks"
                    element={
                        <ProtectedRoute>
                            <TasksPage/>
                        </ProtectedRoute>
                    }
                />

                <Route path="*" element={<Navigate to="/login" replace/>}/>
            </Routes>
        </BrowserRouter>
    );
}

export default App;
