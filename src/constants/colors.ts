export const CATEGORY_COLORS = [
    'bg-slate-500',
    'bg-red-500',
    'bg-orange-500',
    'bg-amber-500',
    'bg-green-500',
    'bg-emerald-500',
    'bg-teal-500',
    'bg-cyan-500',
    'bg-sky-500',
    'bg-blue-500',
    'bg-indigo-500',
    'bg-violet-500',
    'bg-purple-500',
    'bg-fuchsia-500',
    'bg-pink-500',
    'bg-rose-500'
];

// Mapped to CATEGORY_COLORS to ensure consistency between "Projects" (Solid) and "Playlists" (Gradients)
export const PLAYLIST_GRADIENTS = [
    'from-slate-500 to-slate-700',      // slate
    'from-red-500 to-rose-600',         // red
    'from-orange-500 to-amber-600',     // orange
    'from-amber-400 to-orange-500',     // amber
    'from-green-500 to-emerald-600',    // green
    'from-emerald-500 to-teal-600',     // emerald
    'from-teal-500 to-cyan-600',        // teal
    'from-cyan-500 to-blue-600',        // cyan
    'from-sky-500 to-blue-600',         // sky
    'from-blue-500 to-indigo-600',      // blue
    'from-indigo-500 to-violet-600',    // indigo
    'from-violet-500 to-purple-600',    // violet
    'from-purple-500 to-fuchsia-600',   // purple
    'from-fuchsia-500 to-pink-600',     // fuchsia
    'from-pink-500 to-rose-600',        // pink
    'from-rose-500 to-red-600'          // rose
];

/**
 * Helper to deterimine if a color string is a gradient.
 * Useful for switching generic UI components logic.
 */
export const isGradient = (colorClass: string) => colorClass.includes('from-');

/**
 * Returns a deterministic gradient based on ID.
 */
export const getDeterministicGradient = (id: string) => {
    // Determine index based on char code sum
    const sum = id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return PLAYLIST_GRADIENTS[sum % PLAYLIST_GRADIENTS.length];
};

/**
 * Hex codes for standard colors, useful for Canvas/Gradients where classes won't work.
 */
export const COLOR_HEX_MAP: Record<string, string> = {
    blue: '#3b82f6', red: '#ef4444', green: '#10b981',
    amber: '#f59e0b', purple: '#8b5cf6', pink: '#ec4899',
    indigo: '#6366f1', teal: '#14b8a6', cyan: '#06b6d4',
    orange: '#f97316', slate: '#64748b', gray: '#6b7280',
    emerald: '#10b981', violet: '#8b5cf6', yellow: '#eab308',
    lime: '#84cc16', fuchsia: '#d946ef', rose: '#f43f5e',
    sky: '#0ea5e9'
};
