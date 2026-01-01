export const getPriorityStyles = (priority?: string) => {
    switch (priority) {
        case 'high':
            return 'text-status-error bg-status-error/10 border-status-error/20';
        case 'medium':
            return 'text-status-warning bg-status-warning/10 border-status-warning/20';
        case 'low':
            return 'text-status-success bg-status-success/10 border-status-success/20';
        default:
            return 'text-text-secondary bg-bg-subtle border-border'; // Default/None
    }
};

export const PRIORITY_CONFIG = [
    { value: 'low', label: 'Low' },
    { value: 'medium', label: 'Medium' },
    { value: 'high', label: 'High' }
] as const;
