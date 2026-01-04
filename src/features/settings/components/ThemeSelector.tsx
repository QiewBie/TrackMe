import React from 'react';
import { useTheme } from '../../../context/ThemeContext';
import { useUI } from '../../../context/UIContext';
import { ThemeCard } from './ThemeCard';
import { Text } from '../../../components/ui/Typography';
import { Palette } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export const ThemeSelector: React.FC = () => {
    const { currentTheme, setThemeId, availableThemes } = useTheme();
    const { darkMode } = useUI();
    const { t } = useTranslation();

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-2 text-text-primary">
                <Palette size={18} className="text-brand-primary" />
                <Text variant="small" weight="bold" className="uppercase tracking-wider opacity-80">
                    {t('settings.theme_palette', 'Color Theme')}
                </Text>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {availableThemes.map(theme => (
                    <ThemeCard
                        key={theme.id}
                        theme={theme}
                        isActive={currentTheme.id === theme.id}
                        onClick={() => setThemeId(theme.id)}
                        isDark={darkMode}
                    />
                ))}
            </div>
        </div>
    );
};
