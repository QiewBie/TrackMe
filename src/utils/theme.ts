/**
 * Centralized theme configuration for the application.
 * This file separates UI "Brand" logic (handled by Tailwind 'brand' tokens)
 * from Content/Category styling (handled here).
 */

export const TAG_COLORS = {
    orange: { label: 'Orange', value: 'amber', bg: 'bg-amber-500', text: 'text-amber-500', ring: 'ring-amber-500' },
    blue: { label: 'Blue', value: 'blue', bg: 'bg-blue-500', text: 'text-blue-500', ring: 'ring-blue-500' },
    indigo: { label: 'Indigo', value: 'indigo', bg: 'bg-indigo-500', text: 'text-indigo-500', ring: 'ring-indigo-500' },
    emerald: { label: 'Emerald', value: 'emerald', bg: 'bg-emerald-500', text: 'text-emerald-500', ring: 'ring-emerald-500' },
    purple: { label: 'Purple', value: 'purple', bg: 'bg-purple-500', text: 'text-purple-500', ring: 'ring-purple-500' },
    pink: { label: 'Pink', value: 'pink', bg: 'bg-pink-500', text: 'text-pink-500', ring: 'ring-pink-500' },
    rose: { label: 'Rose', value: 'rose', bg: 'bg-rose-500', text: 'text-rose-500', ring: 'ring-rose-500' },
    cyan: { label: 'Cyan', value: 'cyan', bg: 'bg-cyan-500', text: 'text-cyan-500', ring: 'ring-cyan-500' },
} as const;

export type TagColorKey = keyof typeof TAG_COLORS;

/**
 * Helper to get Tailwind classes for a specific category color.
 * Useful for dynamic category rendering.
 */
export const getCategoryColor = (colorName: string) => {
    // Basic fallback logic
    const normalized = colorName.toLowerCase();
    for (const key in TAG_COLORS) {
        if (normalized.includes(key)) {
            return TAG_COLORS[key as TagColorKey];
        }
    }
    return TAG_COLORS.blue; // Default fallback
};
