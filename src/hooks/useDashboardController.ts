import { useState, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTaskContext } from '../context/TaskContext';
import { useConfirmation } from './useConfirmation';
import { useProjectNotes } from './useProjectNotes';
import { readFileAsDataURL } from '../utils/fileHelpers';
import { Task, FilterType } from '../types';

export const useDashboardController = () => {
    const { user, updateProfile, logout, deleteProfile } = useAuth();
    const { tasks, updateTaskDetails, deleteTask: deleteTaskById, restoreTask } = useTaskContext();
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    // State
    const [selectedTask, setSelectedTask] = useState<Task | null>(null);
    const [undoTask, setUndoTask] = useState<Task | null>(null);
    const [scrollContainer, setScrollContainer] = useState<HTMLElement | null>(null);

    // Filter Logic
    const filter = (searchParams.get('filter') as FilterType) || 'all';
    const setFilter = (newFilter: FilterType) => {
        navigate(`/?filter=${newFilter}`);
    };

    // Avatar Logic
    const updateAvatar = async (file: File) => {
        try {
            const avatarUrl = await readFileAsDataURL(file);
            if (user) {
                updateProfile({ ...user, avatar: avatarUrl });
            }
        } catch (error) {
            console.error("Failed to upload avatar", error);
        }
    };

    // Project Notes
    const { getNote: getProjectNote, saveNote: saveProjectNote } = useProjectNotes();

    // Undo Logic
    const handleUndo = () => {
        if (undoTask) {
            restoreTask(undoTask);
            setUndoTask(null);
        }
    };

    // Delete Confirmation Logic
    const {
        itemToDelete: taskToDelete,
        requestDelete: handleDelete,
        cancelDelete,
        confirmDelete
    } = useConfirmation<Task>((task) => {
        deleteTaskById(task.id);
        setUndoTask(task);
        if (selectedTask?.id === task.id) {
            setSelectedTask(null);
        }
    });

    // Context Value Construction
    const contextValue = useMemo(() => ({
        user: user!,
        setUser: updateProfile,
        updateAvatar,
        logout,
        deleteProfile,
        filter,
        setFilter,
        scrollContainer,
        getProjectNote,
        saveProjectNote,
        onEdit: setSelectedTask,
        onDeleteTask: handleDelete
    }), [user, updateProfile, logout, deleteProfile, filter, scrollContainer, getProjectNote, saveProjectNote, setSelectedTask, handleDelete]);

    return {
        user,
        filter,
        setFilter,
        selectedTask,
        setSelectedTask,
        undoTask,
        setUndoTask,
        handleUndo,
        taskToDelete,
        cancelDelete,
        confirmDelete,
        handleDelete,
        updateTaskDetails,
        setScrollContainer,
        contextValue,
        tasks
    };
};
