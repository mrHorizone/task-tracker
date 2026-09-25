import {useState, type SubmitEvent} from "react";
import {Navigate, useNavigate} from "react-router-dom";
import styles from "./LoginPage.module.css";
import {authService} from "../../services/authService.ts";

function LoginPage() {
    const [login, setLogin] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    if (authService.isAuthenticated()) {
        return <Navigate to="/tasks" replace/>;
    }

    const handleSubmit = async (e: SubmitEvent) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        try {
            await authService.login({login, password});
            navigate("/tasks");
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to log in");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.mainContainer}>
            <div className={styles.loginArea}>
                <h2 className={styles.title}>Login</h2>
                {error && <div className={styles.error}>{error}</div>}
                <form onSubmit={handleSubmit} className={styles.form}>
                    <div className={styles.inputGroup}>
                        <label htmlFor="login">Login</label>
                        <input
                            id="login"
                            type="text"
                            value={login}
                            onChange={(e) => setLogin(e.target.value)}
                            required
                        />
                    </div>
                    <div className={styles.inputGroup}>
                        <label htmlFor="password">Password</label>
                        <input
                            id="password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>
                    <div className={styles.actions}>
                        <button className="dashed" onClick={() => navigate("/register")}>
                            Register
                        </button>
                        <button type="submit" disabled={loading}>
                            {loading ? "Logging in..." : "Login"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default LoginPage;
