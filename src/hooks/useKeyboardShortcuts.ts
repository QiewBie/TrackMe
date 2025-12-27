import { useEffect } from 'react';

export interface ShortcutConfig {
    key: string;
    ctrl?: boolean;
    shift?: boolean;
    alt?: boolean;
    action: () => void;
    preventDefault?: boolean;
}

export const useKeyboardShortcuts = (shortcuts: ShortcutConfig[]) => {
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            // Ignore if input/textarea is focused
            const target = event.target as HTMLElement;
            if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
                return;
            }

            shortcuts.forEach(shortcut => {
                const keyMatch = event.key.toLowerCase() === shortcut.key.toLowerCase() || event.code === shortcut.key;
                const ctrlMatch = !!shortcut.ctrl === event.ctrlKey || !!shortcut.ctrl === event.metaKey; // Support Cmd on Mac
                const shiftMatch = !!shortcut.shift === event.shiftKey;
                const altMatch = !!shortcut.alt === event.altKey;

                if (keyMatch && ctrlMatch && shiftMatch && altMatch) {
                    if (shortcut.preventDefault) {
                        event.preventDefault();
                    }
                    shortcut.action();
                }
            });
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [shortcuts]);
};
