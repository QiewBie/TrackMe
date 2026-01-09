/**
 * Logger utility for development-only logging
 * In production, these logs are suppressed
 */

const isDev = import.meta.env.DEV;

type LogFn = (msg: string, ...args: any[]) => void;

interface Logger {
    sync: LogFn;
    session: LogFn;
    timer: LogFn;
    time: LogFn;
    ledger: LogFn;
    orchestrator: LogFn;
}

const createLogFn = (prefix: string): LogFn => {
    return (msg: string, ...args: any[]) => {
        if (isDev) {
            console.log(`[${prefix}] ${msg}`, ...args);
        }
    };
};

export const log: Logger = {
    sync: createLogFn('Sync'),
    session: createLogFn('Session'),
    timer: createLogFn('Timer'),
    time: createLogFn('Time'),
    ledger: createLogFn('Ledger'),
    orchestrator: createLogFn('Orchestrator'),
};

// Error logging always enabled
export const logError = {
    sync: (msg: string, error: any) => console.error(`[Sync] ${msg}`, error),
    session: (msg: string, error: any) => console.error(`[Session] ${msg}`, error),
    timer: (msg: string, error: any) => console.error(`[Timer] ${msg}`, error),
};
