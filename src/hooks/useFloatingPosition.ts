import { useState, useEffect, useCallback, RefObject } from 'react';

interface Position {
    top: number;
    left: number;
    width?: number; // Optional sync width
    maxWidth?: number; // Ensure it fits screen
}

interface UseFloatingPositionOptions {
    isOpen: boolean;
    align?: 'left' | 'right' | 'center';
    side?: 'top' | 'bottom';
    offset?: number;
    autoFlip?: boolean; // If true, flips side if collision detected
}

export const useFloatingPosition = (
    triggerRef: RefObject<HTMLElement>,
    contentRef: RefObject<HTMLElement>,
    { isOpen, align = 'left', side = 'bottom', offset = 8, autoFlip = true }: UseFloatingPositionOptions
) => {
    const [style, setStyle] = useState<React.CSSProperties>({
        position: 'absolute',
        top: 0,
        left: 0,
        opacity: 0, // Hide until calculated
        pointerEvents: 'none'
    });

    const updatePosition = useCallback(() => {
        if (!isOpen || !triggerRef.current) return;

        const triggerRect = triggerRef.current.getBoundingClientRect();
        const contentRect = contentRef.current?.getBoundingClientRect();

        // Basic dimensions
        const contentW = contentRect?.width || 340; // Fallback or current
        const contentH = contentRect?.height || 400;

        const scrollX = window.scrollX;
        const scrollY = window.scrollY;
        const viewportW = document.documentElement.clientWidth;
        const viewportH = document.documentElement.clientHeight;

        let top = 0;
        let left = 0;

        // 1. Vertical Positioning (Top/Bottom) with Auto-Flip
        let currentSide = side;

        if (autoFlip) {
            const spaceBelow = viewportH - triggerRect.bottom;
            const spaceAbove = triggerRect.top;

            // If requested bottom but not enough space, and top has more space
            if (side === 'bottom' && spaceBelow < contentH && spaceAbove > spaceBelow) {
                currentSide = 'top';
            }
            // If requested top but not enough space...
            else if (side === 'top' && spaceAbove < contentH && spaceBelow > spaceAbove) {
                currentSide = 'bottom';
            }
        }

        if (currentSide === 'bottom') {
            top = triggerRect.bottom + scrollY + offset;
        } else {
            top = triggerRect.top + scrollY - contentH - offset;
        }

        // 2. Horizontal Positioning (Align)
        if (align === 'left') {
            left = triggerRect.left + scrollX;
        } else if (align === 'right') {
            left = triggerRect.right + scrollX - contentW;
        } else { // Center
            left = triggerRect.left + scrollX + (triggerRect.width / 2) - (contentW / 2);
        }

        // 3. Horizontal Collision Detection (Keep inside screen)
        const rightEdge = left + contentW;
        if (rightEdge > viewportW + scrollX) {
            // Push left
            left = (viewportW + scrollX) - contentW - 16; // 16px padding
        }
        if (left < scrollX) {
            // Push right
            left = scrollX + 16;
        }

        // 4. Max Height Constraint (Optional safety)
        // If it still doesn't fit vertical, we might limit height.
        // But for now we relying on CSS max-h.

        setStyle({
            position: 'absolute',
            top,
            left,
            zIndex: 9999,
            opacity: 1,
            pointerEvents: 'auto'
        });

    }, [isOpen, align, side, offset, autoFlip, triggerRef, contentRef]);

    // Initial calculation and listeners
    useEffect(() => {
        if (isOpen) {
            updatePosition();
            // Recalculate on fast DOM updates or animations frames? 
            // Generic listeners are usually enough.
            window.addEventListener('resize', updatePosition);
            window.addEventListener('scroll', updatePosition, true); // Capture phase for all scroll containers

            return () => {
                window.removeEventListener('resize', updatePosition);
                window.removeEventListener('scroll', updatePosition, true);
            };
        }
    }, [isOpen, updatePosition]);

    // ResizeObserver for Content (if content changes size, re-position)
    useEffect(() => {
        if (!isOpen || !contentRef.current) return;
        const ro = new ResizeObserver(() => updatePosition());
        ro.observe(contentRef.current);
        return () => ro.disconnect();
    }, [isOpen, updatePosition, contentRef]);

    return style;
};
