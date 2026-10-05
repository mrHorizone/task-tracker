import {useNavigate} from 'react-router-dom';
import {authService} from '../../services/authService.ts';
import styles from './AppHeader.module.css';

interface AppHeaderProps {
    onExportCsv?: () => void;
    isExporting?: boolean;
}

function AppHeader({onExportCsv, isExporting}: AppHeaderProps = {}) {
    const navigate = useNavigate();
    const user = authService.getUser();

    const handleLogout = () => {
        authService.logout();
        navigate('/login');
    };

    return (
        <header className={styles.header}>
            <span className={styles.appName}>{user?.login}'s tasks</span>

            <div className={styles.userPanel}>
                {onExportCsv && (
                    <button onClick={onExportCsv} disabled={isExporting}>
                        {isExporting ? 'Exporting...' : 'Export to CSV'}
                    </button>
                )}
                <button onClick={handleLogout}>
                    Logout
                </button>
            </div>
        </header>
    );
}

export default AppHeader;