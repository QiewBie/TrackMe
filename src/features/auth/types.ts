export interface UserSettings {
    theme: 'light' | 'dark'; // Corresponds to Dark Mode
    themeId?: string;        // Corresponds to Color Palette (e.g., 'serenity')
    language: 'en' | 'uk';
    // Add known settings here instead of allowing [key: string]: any
    soundEnabled?: boolean;
    autoStartBreaks?: boolean;
    updatedAt?: string; // Sync V3 Timestamp
}

export interface User {
    id: string; // UUID
    username: string; // Unique local identifier
    name: string; // Display Name
    role: string;
    avatar?: string; // Base64 or URL
    createdAt: string;
    /** @deprecated V3 Sync: Use ThemeContext/PreferencesService instead. This field contains dummy defaults. */
    preferences: UserSettings;
}
