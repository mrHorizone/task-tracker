import {useState, useRef, useEffect, useId} from "react";
import type {Task} from "../../types/task.ts";
import styles from './TaskItem.module.css';
import * as React from "react";

type NoteItemProps = {
    task: Task
    onDelete: (id: number) => void
    onSave: (id: number, title: string, text: string) => void
}

function TaskItem({task, onDelete, onSave}: NoteItemProps) {
    const isCreate = !task.title;

    const [isEditing, setIsEditing] = useState(isCreate);
    const [title, setTitle] = useState(task.title);
    const [text, setText] = useState(task.text);
    const [isTitleTouched, setIsTitleTouched] = useState(false);
    const [isTextTouched, setIsTextTouched] = useState(false);

    const titleInputRef = useRef<HTMLInputElement>(null);
    const titleInputId = useId();
    const descInputId = useId();

    // Focus title input right after mount if creating
    useEffect(() => {
        if (isCreate) {
            titleInputRef.current?.focus();
        }
    }, [isCreate]);

    const isTitleInvalid = !title || !title.trim();
    const showTitleError = isTitleTouched && isTitleInvalid;

    const isTextInvalid = !text || !text.trim();
    const showTextError = isTextTouched && isTextInvalid;

    const isFormInvalid = isTitleInvalid || isTextInvalid;

    const handleDragStart = (e: React.DragEvent) => {
        e.dataTransfer.setData("text/plain", task.id.toString());
        e.dataTransfer.effectAllowed = "move";
    };

    return (
        <div
            className={`${styles.task}${isEditing ? ` ${styles.editing}` : ''}`}
            draggable={!isEditing}
            onDragStart={handleDragStart}
        >
            {isEditing ? (
                <>
                    <div className={styles.inputGroup}>
                        <label htmlFor={titleInputId}>
                            Title
                        </label>
                        <input
                            id={titleInputId}
                            ref={titleInputRef}
                            value={title}
                            placeholder="Enter title..."
                            aria-invalid={showTitleError}
                            onChange={event => setTitle(event.target.value)}
                            onBlur={() => setIsTitleTouched(true)}
                        />
                    </div>

                    <div className={styles.inputGroup}>
                        <label htmlFor={descInputId}>
                            Description
                        </label>
                        <textarea
                            id={descInputId}
                            value={text}
                            placeholder="Enter description..."
                            rows={3}
                            aria-invalid={showTextError}
                            onChange={event => setText(event.target.value)}
                            onBlur={() => setIsTextTouched(true)}
                        />
                    </div>

                    <div className={styles.actions}>
                        <button onClick={() => {
                            if (isCreate) {
                                onDelete(task.id);
                            } else {
                                setIsEditing(false);
                                setTitle(task.title);
                                setText(task.text);
                                setIsTitleTouched(false);
                                setIsTextTouched(false);
                            }
                        }}>
                            Cancel
                        </button>

                        <button
                            disabled={isFormInvalid}
                            onClick={() => {
                                if (isFormInvalid) return;
                                onSave(task.id, title, text);
                                setIsEditing(false);
                                setIsTitleTouched(false);
                                setIsTextTouched(false);
                            }}>
                            Save
                        </button>
                    </div>
                </>
            ) : (
                <>
                    <div className={styles.inputGroup}>
                        <label>Title</label>
                        <span className={`${styles.field} ${styles.titleField}`} title={task.title}>
                            {task.title}
                        </span>
                    </div>

                    <div className={styles.inputGroup}>
                        <label>Description</label>
                        <span className={`${styles.field} ${styles.descField}`}>
                            {task.text || '-'}
                        </span>
                    </div>

                    <div className={styles.actions}>
                        <button onClick={() => {
                            setIsEditing(true);
                            setIsTitleTouched(false);
                            setIsTextTouched(false);
                        }}>
                            Edit
                        </button>

                        <button onClick={() => onDelete(task.id)}>
                            Delete
                        </button>
                    </div>
                </>
            )}
        </div>
    );
}

export default TaskItem;