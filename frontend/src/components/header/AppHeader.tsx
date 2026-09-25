import {useNavigate} from 'react-router-dom';
import {authService} from '../../services/authService.ts';
import styles from './AppHeader.module.css';

function AppHeader() {
    const navigate = useNavigate();

    const handleLogout = () => {
        authService.logout();
        navigate('/login');
    };

    return (
        <header className={styles.header}>
            <div>
                notifications
            </div>

            <span className={styles.appName}>Task tracker App</span>

            <button onClick={handleLogout}>
                Logout
            </button>
        </header>
    );
}

export default AppHeader;