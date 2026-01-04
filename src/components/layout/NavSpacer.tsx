import React from 'react';

/**
 * NavSpacer Component
 * 
 * Provides a safe spacing block at the bottom of scrollable content
 * to prevent the floating navigation bar from covering the last items.
 * 
 * Logic:
 * - Height matches the --layout-mobile-padding-bottom CSS variable
 * - Visible ONLY on mobile (< lg breakpoint)
 * - Transparent (does not affect background)
 */
const NavSpacer: React.FC = () => {
    return (
        <div
            className="w-full lg:hidden shrink-0 pointer-events-none"
            style={{ height: 'var(--layout-mobile-padding-bottom)' }}
            aria-hidden="true"
        />
    );
};

export default NavSpacer;
