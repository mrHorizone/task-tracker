import {type SubmitEvent, useState} from "react";
import {useNavigate} from "react-router-dom";
import {authService} from "../../services/authService.ts";
import styles from "./RegisterPage.module.css";

function RegisterPage() {
    const [login, setLogin] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e: SubmitEvent) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        try {
            await authService.register({login, password});
            navigate("/login");
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to register");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.mainContainer}>
            <div className={styles.registerArea}>
                <h2 className={styles.title}>Register</h2>
                {error && <div className={styles.error}>{error}</div>}
                <form onSubmit={handleSubmit} className={styles.form}>
                    <div className={styles.inputGroup}>
                        <label htmlFor="login" className={styles.label}>Login</label>
                        <input
                            id="login"
                            type="text"
                            value={login}
                            onChange={(e) => setLogin(e.target.value)}
                            required
                        />
                    </div>
                    <div className={styles.inputGroup}>
                        <label htmlFor="password" className={styles.label}>Password</label>
                        <input
                            id="password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>
                    <div className={styles.actions}>
                        <button className="dashed" onClick={() => navigate("/login")}>
                            Login
                        </button>
                        <button type="submit" disabled={loading}>
                            {loading ? "Registering..." : "Register"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default RegisterPage;