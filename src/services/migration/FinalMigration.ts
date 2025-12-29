import { Task } from '../../types';
import { TimeLedger } from '../storage/TimeLedger';
import { localStorageAdapter } from '../storage/LocalStorageAdapter';

const MIGRATION_KEY = 'v2_final_purge_completed';

export const FinalMigration = {
    run: async () => {
        // 1. Check if already ran
        const isDone = localStorageAdapter.getItem<boolean>(MIGRATION_KEY);
        if (isDone) return;

        console.log('[FinalMigration] Starting V2 Legacy Purge...');

        // 2. Load all tasks (Raw access to see 'timeSpent')
        const tasks = localStorageAdapter.getItem<any[]>('tasks') || []; // Use any to access timeSpent

        if (tasks.length === 0) {
            localStorageAdapter.setItem(MIGRATION_KEY, true);
            return;
        }

        let changesMade = false;
        const updatedTasks = tasks.map(t => {
            // SAFEGUARD: Ensure we have an ID
            if (!t.id) return t;

            const legacyTime = t.timeSpent || 0;

            // Only migrate if there is legacy time
            if (legacyTime > 0) {
                // Check what we already have in logs
                const currentLogTotal = TimeLedger.getAggregatedTime(t.id);

                // If logs don't account for the legacy time, create a delta log
                if (currentLogTotal < legacyTime) {
                    const missingTime = legacyTime - currentLogTotal;
                    console.log(`[FinalMigration] Task "${t.title}": Found ${missingTime}s unlogged legacy time. Creating Log.`);

                    TimeLedger.saveLog({
                        id: crypto.randomUUID(),
                        taskId: t.id,
                        startTime: new Date().toISOString(), // Use now as import time, or t.createdAt? Now is safer for sorting.
                        duration: missingTime,
                        type: 'migration', // Specific type for identifying imports
                        note: 'Legacy V1 Final Import'
                    });

                    changesMade = true;
                }
            }

            // 3. PURGE: Remove timeSpent field physically
            // destructturing to exclude timeSpent
            const { timeSpent, ...cleanTask } = t;

            // Ensure cachedTotalTime is set correctly to the NEW total (Logs only) 
            // actually, useTasks will re-hydrate this from logs anyway, but let's set it 
            // so if useTasks reads it raw, it's correct.
            // But wait, if we delete timeSpent, we rely 100% on logs.
            // The Next useTasks render will call getAggregatedTime(id) and fill cachedTotalTime.
            return cleanTask;
        });

        // 4. Save cleaned tasks
        await localStorageAdapter.setItem('tasks', updatedTasks);
        localStorageAdapter.setItem(MIGRATION_KEY, true);

        console.log(`[FinalMigration] Complete. ${changesMade ? 'Logs created.' : 'No missing logs.'} 'timeSpent' field purged.`);

        // Force reload to refresh UI if needed (though onStart is usually when this runs)
        // window.location.reload(); // Aggressive, maybe let the app handle it.
    }
};
