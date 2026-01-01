import { CATEGORY_COLORS, getCategoryColor } from '../features/theme/colors';

/**
 * Theme Service (Legacy/Shim)
 * Refactored to point to `features/theme` where possible.
 */

// Format HSL to Hex
const hslToHex = (h: number, s: number, l: number): string => {
    l /= 100;
    const a = s * Math.min(l, 1 - l) / 100;
    const f = (n: number) => {
        const k = (n + h / 30) % 12;
        const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
        return Math.round(255 * color).toString(16).padStart(2, '0');
    };
    return `#${f(0)}${f(8)}${f(4)}`;
};

/**
 * @deprecated Use CSS variables `hsl(var(--variable-name))` instead. Reading from DOM causes layout thrashing.
 */
export const getThemeColor = (variableName: string): string => {
    try {
        if (typeof document === 'undefined') return '#000000';

        const root = document.documentElement;
        // Optimization: Check if it's a known variable to avoid style recalc if possible? 
        // For now, we just warn.
        // console.warn(`[ThemeService] getThemeColor('${variableName}') is deprecated. Use CSS variables directly.`);

        const computed = getComputedStyle(root).getPropertyValue(variableName).trim();

        if (!computed) {
            return '#000000';
        }

        const parts = computed.split(' ').filter(p => p !== '/');
        if (parts.length < 3) return computed;

        const h = parseFloat(parts[0]);
        const s = parseFloat(parts[1].replace('%', ''));
        const l = parseFloat(parts[2].replace('%', ''));

        return hslToHex(h, s, l);
    } catch (e) {
        console.error('[ThemeService] Error parsing color:', e);
        return '#000000';
    }
};

export const CHART_COLORS = {
    primary: 'var(--brand-primary)',
    success: 'var(--status-success)',
    warning: 'var(--status-warning)',
    error: 'var(--status-error)',
    surface: 'var(--bg-surface)',
    text: 'var(--text-primary)',
    textSecondary: 'var(--text-secondary)',
    border: 'var(--border-color)',
};

/**
 * @deprecated Use CATEGORY_COLORS from 'features/theme/colors' instead.
 * Mapping logic maintained for backward compatibility.
 */
export const TAG_COLORS = {
    blue: { text: 'text-tag-blue', bg: 'bg-tag-blue', border: 'border-tag-blue', soft: 'bg-tag-blue/10 text-tag-blue' },
    orange: { text: 'text-tag-amber', bg: 'bg-tag-amber', border: 'border-tag-amber', soft: 'bg-tag-amber/10 text-tag-amber' },
    indigo: { text: 'text-tag-indigo', bg: 'bg-tag-indigo', border: 'border-tag-indigo', soft: 'bg-tag-indigo/10 text-tag-indigo' },
    green: { text: 'text-tag-emerald', bg: 'bg-tag-emerald', border: 'border-tag-emerald', soft: 'bg-tag-emerald/10 text-tag-emerald' },
    red: { text: 'text-tag-red', bg: 'bg-tag-red', border: 'border-tag-red', soft: 'bg-tag-red/10 text-tag-red' },
    purple: { text: 'text-tag-purple', bg: 'bg-tag-purple', border: 'border-tag-purple', soft: 'bg-tag-purple/10 text-tag-purple' },
    pink: { text: 'text-tag-pink', bg: 'bg-tag-pink', border: 'border-tag-pink', soft: 'bg-tag-pink/10 text-tag-pink' },
    cyan: { text: 'text-tag-cyan', bg: 'bg-tag-cyan', border: 'border-tag-cyan', soft: 'bg-tag-cyan/10 text-tag-cyan' },
};

/**
 * Semantic Gradients
 */
export const SEMANTIC_GRADIENTS = [
    'from-tag-slate to-tag-slate/80',
    'from-tag-red to-tag-red/80',
    'from-tag-amber to-tag-amber/80',
    'from-tag-green to-tag-green/80',
    'from-tag-emerald to-tag-emerald/80',
    'from-tag-cyan to-tag-cyan/80',
    'from-tag-blue to-tag-blue/80',
    'from-tag-indigo to-tag-indigo/80',
    'from-tag-purple to-tag-purple/80',
    'from-tag-pink to-tag-pink/80',
];

export const getDeterministicGradient = (id: string) => {
    const sum = id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return SEMANTIC_GRADIENTS[sum % SEMANTIC_GRADIENTS.length];
};

// Re-export Category Colors from Feature Slice
export * from '../features/theme/colors';
