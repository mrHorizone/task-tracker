import {useState, useRef, useEffect, useId} from "react";
import type {Task, TaskEventUser} from "../../types/task.ts";
import styles from './TaskItem.module.css';
import * as React from "react";

type NoteItemProps = {
    task: Task;
    lockedByUser?: TaskEventUser;
    onDelete: (id: number) => void;
    onSave: (id: number, title: string, text: string) => void;
    onStartEdit?: (id: number) => void;
    onStopEdit?: (id: number) => void;
}

function TaskItem({task, lockedByUser, onDelete, onSave, onStartEdit, onStopEdit}: NoteItemProps) {
    const isCreate = !task.title;

    const [isEditing, setIsEditing] = useState(isCreate);
    const [title, setTitle] = useState(task.title);
    const [text, setText] = useState(task.text);
    const [isTitleTouched, setIsTitleTouched] = useState(false);
    const [isTextTouched, setIsTextTouched] = useState(false);

    const isLocked = Boolean(lockedByUser);

    const titleInputRef = useRef<HTMLInputElement>(null);
    const titleInputId = useId();
    const descInputId = useId();

    // Focus title input right after mount if creating
    useEffect(() => {
        if (isCreate) {
            titleInputRef.current?.focus();
        }
    }, [isCreate]);

    // Keep title/text in sync if task props update from outside
    useEffect(() => {
        if (!isEditing) {
            setTitle(task.title);
            setText(task.text);
        }
    }, [task.title, task.text, isEditing]);

    const isTitleInvalid = !title || !title.trim();
    const showTitleError = isTitleTouched && isTitleInvalid;

    const isTextInvalid = !text || !text.trim();
    const showTextError = isTextTouched && isTextInvalid;

    const isFormInvalid = isTitleInvalid || isTextInvalid;

    const handleDragStart = (e: React.DragEvent) => {
        if (isEditing || isLocked) {
            e.preventDefault();
            return;
        }
        e.dataTransfer.setData("text/plain", task.id.toString());
        e.dataTransfer.effectAllowed = "move";
    };

    const handleStartEditing = () => {
        if (isLocked) return;
        setIsEditing(true);
        setIsTitleTouched(false);
        setIsTextTouched(false);
        onStartEdit?.(task.id);
    };

    const handleCancel = () => {
        if (isCreate) {
            onDelete(task.id);
        } else {
            setIsEditing(false);
            setTitle(task.title);
            setText(task.text);
            setIsTitleTouched(false);
            setIsTextTouched(false);
            onStopEdit?.(task.id);
        }
    };

    const handleSave = () => {
        if (isFormInvalid) return;
        onSave(task.id, title, text);
        setIsEditing(false);
        setIsTitleTouched(false);
        setIsTextTouched(false);
        onStopEdit?.(task.id);
    };

    return (
        <div
            className={`${styles.task}${isEditing ? ` ${styles.editing}` : ''}${isLocked ? ` ${styles.locked}` : ''}`}
            draggable={!isEditing && !isLocked}
            onDragStart={handleDragStart}
            title={lockedByUser ? `Editing by ${lockedByUser.login}...` : undefined}
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
                        <button onClick={handleCancel}>
                            Cancel
                        </button>

                        <button
                            disabled={isFormInvalid}
                            onClick={handleSave}>
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

                    {(task.author || task.createdAt || task.updatedBy || task.updatedAt) && (
                        <div className={styles.metaInfo}>
                            {(task.author || task.createdAt) && (
                                <div className={styles.metaItem}>
                                    <span>
                                        Created by: <span className={styles.metaAuthor}>{task.author?.login || 'Unknown'}</span>
                                    </span>
                                    {task.createdAt && (
                                        <span>
                                            {new Date(task.createdAt).toLocaleString(undefined, {
                                                year: 'numeric',
                                                month: 'numeric',
                                                day: 'numeric',
                                                hour: '2-digit',
                                                minute: '2-digit',
                                            })}
                                        </span>
                                    )}
                                </div>
                            )}

                            {(task.updatedBy || (task.updatedAt && task.createdAt && new Date(task.updatedAt).getTime() !== new Date(task.createdAt).getTime())) && (
                                <div className={styles.metaItem}>
                                    <span>
                                        Updated by: <span className={styles.metaAuthor}>{task.updatedBy?.login || 'Unknown'}</span>
                                    </span>
                                    {task.updatedAt && (
                                        <span>
                                            {new Date(task.updatedAt).toLocaleString(undefined, {
                                                year: 'numeric',
                                                month: 'numeric',
                                                day: 'numeric',
                                                hour: '2-digit',
                                                minute: '2-digit',
                                            })}
                                        </span>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    <div className={styles.actions}>
                        <button
                            disabled={isLocked}
                            title={isLocked ? `Task is currently being edited by ${lockedByUser?.login}` : undefined}
                            onClick={handleStartEditing}
                        >
                            Edit
                        </button>

                        <button
                            disabled={isLocked}
                            title={isLocked ? `Task is currently being edited by ${lockedByUser?.login}` : undefined}
                            onClick={() => onDelete(task.id)}
                        >
                            Delete
                        </button>
                    </div>
                </>
            )}
        </div>
    );
}

export default TaskItem;