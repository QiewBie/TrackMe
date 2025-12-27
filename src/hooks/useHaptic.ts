import { useCallback } from 'react';

/**
 * Hook to trigger haptic feedback on supported devices.
 */
export const useHaptic = () => {
    /**
     * Trigger vibration.
     * @param pattern - Duration in ms or pattern array. Default 10ms (light tap).
     */
    const trigger = useCallback((pattern: number | number[] = 10) => {
        if (typeof navigator !== 'undefined' && navigator.vibrate) {
            navigator.vibrate(pattern);
        }
    }, []);

    const light = useCallback(() => trigger(10), [trigger]);
    const medium = useCallback(() => trigger(40), [trigger]);
    const heavy = useCallback(() => trigger(70), [trigger]);
    const success = useCallback(() => trigger([50, 50, 50]), [trigger]);
    const error = useCallback(() => trigger([50, 100, 50, 100, 50]), [trigger]);

    return { trigger, light, medium, heavy, success, error };
};
