import { useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { createBackup, downloadBackup, validateBackup, restoreBackup } from '../utils/backup';
// import { toast } from 'react-hot-toast'; // Toast removed to avoid dep issues

export const useDataPersistence = () => {
    const { user } = useAuth();

    const exportData = useCallback(() => {
        try {
            const backup = createBackup(user?.id);
            downloadBackup(backup);
            // toast.success("Backup downloaded successfully");
        } catch (error) {
            console.error("Export failed:", error);
            alert("Failed to export data.");
        }
    }, [user]);

    const validateImport = useCallback(async (file: File) => {
        try {
            const text = await file.text();
            let data: any;
            try {
                data = JSON.parse(text);
            } catch (e) {
                throw new Error("Invalid JSON file");
            }

            if (!validateBackup(data)) {
                throw new Error("Invalid backup format or missing data.");
            }

            return data;
        } catch (error) {
            console.error("Validation failed:", error);
            throw error;
        }
    }, []);

    const restoreData = useCallback((data: any) => {
        try {
            restoreBackup(data, user?.id);
            window.location.reload();
        } catch (error) {
            console.error("Restore failed:", error);
            throw error;
        }
    }, [user]);

    return { exportData, validateImport, restoreData };
};
