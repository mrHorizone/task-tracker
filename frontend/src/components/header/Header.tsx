import styles from './Header.module.css';

function Header() {
    return (
        <header className={styles.header}>
            <div>
                notifications
            </div>

            <span>Task tracker APP</span>

            <div>
                login/logout
            </div>
        </header>
    )
}

export default Header;