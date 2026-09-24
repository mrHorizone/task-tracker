import styles from './TasksHeader.module.css';

function TasksHeader() {
    return (
        <header className={styles.header}>
            <div>
                notifications
            </div>

            <span>Task tracker APP</span>

            <div>
                logout
            </div>
        </header>
    )
}

export default TasksHeader;