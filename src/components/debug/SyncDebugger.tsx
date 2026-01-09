import React from 'react';
import { useSession } from '../../context/SessionContext';
import { useAuth } from '../../context/AuthContext';
import { formatTime } from '../../utils/formatters';

const SyncDebugger: React.FC = () => {
    const { session, isPaused, isRunning, remaining } = useSession();
    const { user } = useAuth();

    const status = session ? (isPaused ? 'PAUSED' : 'ACTIVE') : 'IDLE';

    return (
        <div className="fixed bottom-4 left-4 z-toast p-4 bg-black/90 text-status-success font-mono text-xs rounded border border-status-success shadow-xl max-w-xs pointer-events-none">
            <h3 className="font-bold border-b border-status-success mb-2">SYNC MATRIX</h3>
            <div className="space-y-1">
                <p>UID: {user?.id?.slice(0, 6)}...</p>
                <div className="h-px bg-white/20 my-1" />
                <p>STATUS: {status}</p>
                <p>RUNNING: {isRunning ? 'YES' : 'NO'}</p>
                <p>TIME: {formatTime(remaining)} ({remaining}s)</p>
                <p>TASK ID: {session?.taskId?.slice(0, 8) || 'NULL'}</p>
                <p>MODE: {session?.mode || 'N/A'}</p>
            </div>
            <div className="mt-2 text-[10px] text-gray-400">
                Using SessionContext (unified system)
            </div>
        </div>
    );
};

export default SyncDebugger;
