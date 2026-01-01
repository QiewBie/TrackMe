/**
 * Category Color Service
 * Maps semantic color IDs (e.g. 'indigo', 'emerald') to their visual representations.
 * Handles both legacy full-class strings and new semantic IDs.
 */

export const CATEGORY_COLORS = [
    { id: 'slate', label: 'Slate', bg: 'bg-tag-slate', text: 'text-tag-slate', dot: 'bg-tag-slate' },
    { id: 'red', label: 'Red', bg: 'bg-tag-red', text: 'text-tag-red', dot: 'bg-tag-red' },
    { id: 'orange', label: 'Orange', bg: 'bg-orange-500', text: 'text-orange-500', dot: 'bg-orange-500' },
    { id: 'amber', label: 'Amber', bg: 'bg-tag-amber', text: 'text-tag-amber', dot: 'bg-tag-amber' },
    { id: 'yellow', label: 'Yellow', bg: 'bg-yellow-500', text: 'text-yellow-600', dot: 'bg-yellow-500' },
    { id: 'lime', label: 'Lime', bg: 'bg-lime-500', text: 'text-lime-600', dot: 'bg-lime-500' },
    { id: 'green', label: 'Green', bg: 'bg-tag-green', text: 'text-tag-green', dot: 'bg-tag-green' },
    { id: 'emerald', label: 'Emerald', bg: 'bg-tag-emerald', text: 'text-tag-emerald', dot: 'bg-tag-emerald' },
    { id: 'teal', label: 'Teal', bg: 'bg-teal-500', text: 'text-teal-600', dot: 'bg-teal-500' },
    { id: 'cyan', label: 'Cyan', bg: 'bg-tag-cyan', text: 'text-tag-cyan', dot: 'bg-tag-cyan' },
    { id: 'sky', label: 'Sky', bg: 'bg-sky-500', text: 'text-sky-600', dot: 'bg-sky-500' },
    { id: 'blue', label: 'Blue', bg: 'bg-tag-blue', text: 'text-tag-blue', dot: 'bg-tag-blue' },
    { id: 'indigo', label: 'Indigo', bg: 'bg-tag-indigo', text: 'text-tag-indigo', dot: 'bg-tag-indigo' },
    { id: 'violet', label: 'Violet', bg: 'bg-tag-purple', text: 'text-tag-purple', dot: 'bg-tag-purple' },
    { id: 'purple', label: 'Purple', bg: 'bg-purple-500', text: 'text-purple-600', dot: 'bg-purple-500' },
    { id: 'fuchsia', label: 'Fuchsia', bg: 'bg-fuchsia-500', text: 'text-fuchsia-600', dot: 'bg-fuchsia-500' },
    { id: 'pink', label: 'Pink', bg: 'bg-tag-pink', text: 'text-tag-pink', dot: 'bg-tag-pink' },
    { id: 'rose', label: 'Rose', bg: 'bg-rose-500', text: 'text-rose-600', dot: 'bg-rose-500' },
] as const;

export type CategoryColorId = typeof CATEGORY_COLORS[number]['id'];

export const getCategoryColor = (colorIdOrString: string) => {
    // 1. Try to find by Semantic ID
    const semanticMatch = CATEGORY_COLORS.find(c => c.id === colorIdOrString);
    if (semanticMatch) return semanticMatch;

    // 2. Fallback: Try to map legacy string matches
    const lower = colorIdOrString.toLowerCase();

    if (lower.includes('slate') || lower.includes('gray')) return CATEGORY_COLORS.find(c => c.id === 'slate');
    if (lower.includes('red')) return CATEGORY_COLORS.find(c => c.id === 'red');
    if (lower.includes('orange')) return CATEGORY_COLORS.find(c => c.id === 'orange');
    if (lower.includes('amber')) return CATEGORY_COLORS.find(c => c.id === 'amber');
    if (lower.includes('yellow')) return CATEGORY_COLORS.find(c => c.id === 'yellow');
    if (lower.includes('lime')) return CATEGORY_COLORS.find(c => c.id === 'lime');
    if (lower.includes('emerald')) return CATEGORY_COLORS.find(c => c.id === 'emerald');
    if (lower.includes('green')) return CATEGORY_COLORS.find(c => c.id === 'green');
    if (lower.includes('teal')) return CATEGORY_COLORS.find(c => c.id === 'teal');
    if (lower.includes('cyan')) return CATEGORY_COLORS.find(c => c.id === 'cyan');
    if (lower.includes('sky')) return CATEGORY_COLORS.find(c => c.id === 'sky');
    if (lower.includes('indigo')) return CATEGORY_COLORS.find(c => c.id === 'indigo');
    if (lower.includes('blue')) return CATEGORY_COLORS.find(c => c.id === 'blue');
    if (lower.includes('violet')) return CATEGORY_COLORS.find(c => c.id === 'violet');
    if (lower.includes('purple')) return CATEGORY_COLORS.find(c => c.id === 'purple');
    if (lower.includes('fuchsia')) return CATEGORY_COLORS.find(c => c.id === 'fuchsia');
    if (lower.includes('pink')) return CATEGORY_COLORS.find(c => c.id === 'pink');
    if (lower.includes('rose')) return CATEGORY_COLORS.find(c => c.id === 'rose');

    // 3. Last Resort: Indigo
    return CATEGORY_COLORS.find(c => c.id === 'indigo') || CATEGORY_COLORS[0];
};

export const getCategoryClass = (colorIdOrString: string, type: 'bg' | 'text' | 'dot' = 'dot'): string => {
    const color = getCategoryColor(colorIdOrString);
    return color ? color[type] : '';
};
