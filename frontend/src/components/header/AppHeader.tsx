import {useNavigate} from 'react-router-dom';
import {authService} from '../../services/authService.ts';
import styles from './AppHeader.module.css';

function AppHeader() {
    const navigate = useNavigate();
    const user = authService.getUser();

    const handleLogout = () => {
        authService.logout();
        navigate('/login');
    };

    return (
        <header className={styles.header}>
            {/*<button className="pulse" onClick={() => {*/}
            {/*    console.log("open sidebar with notifications")*/}
            {/*}}>*/}
            {/*    Notifications*/}
            {/*</button>*/}

            <span className={styles.appName}>{user?.login}'s tasks</span>

            <div className={styles.userPanel}>
                <button onClick={handleLogout}>
                    Logout
                </button>
            </div>
        </header>
    );
}

export default AppHeader;