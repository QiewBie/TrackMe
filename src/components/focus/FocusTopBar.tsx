import React, { memo } from 'react';
import { PanelLeft, Settings, PanelRight } from 'lucide-react';
import Button from '../ui/Button';
import AmbienceSelector from '../shared/AmbienceSelector';
import { useTranslation } from 'react-i18next';
import { LAYOUT } from '../../constants/layout';

interface FocusTopBarProps {
    isTimerRunning: boolean;
    controlsVisible: boolean;
    isZenMode: boolean;
    setZenMode: (val: boolean) => void;
    sidebarOpen: boolean;
    onOpenSettings: () => void;
    onToggleSidebar: () => void;
}

export const FocusTopBar: React.FC<FocusTopBarProps> = memo(({
    isTimerRunning,
    controlsVisible,
    isZenMode,
    setZenMode,
    sidebarOpen,
    onOpenSettings,
    onToggleSidebar
}) => {
    const { t } = useTranslation();

    return (
        <div
            className={`
                absolute top-0 left-0 right-0 z-50 px-6 py-6 flex items-center justify-between
                transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] safe-area-top pt-safe
                ${(isTimerRunning && !controlsVisible) ? 'opacity-0 -translate-y-4 pointer-events-none' : 'opacity-100 translate-y-0'}
                ${sidebarOpen ? LAYOUT.FOCUS.TOPBAR_SHIFT_CLASS : ''}
            `}
            onClick={(e) => e.stopPropagation()}
        >
            {/* Left: Zen Toggle & Ambience */}
            <div className="flex items-center gap-3">
                <Button
                    variant="ghost"
                    size="md"
                    icon={PanelLeft}
                    onClick={() => setZenMode(!isZenMode)}
                    title={isZenMode ? t('focus.exit_zen_mode') || "Show Sidebar" : t('focus.enter_zen_mode') || "Zen Mode"}
                    className="bg-bg-surface/50 backdrop-blur-md border border-white/5 hover:bg-white/10 text-text-primary"
                />
                <AmbienceSelector />
            </div>

            {/* Right: Controls (Settings & Context) */}
            <div className="flex items-center gap-3">
                <Button
                    variant="ghost"
                    size="md"
                    icon={Settings}
                    onClick={onOpenSettings}
                    className="bg-bg-surface/50 backdrop-blur-md border border-white/5 hover:bg-white/10 text-text-primary"
                />
                <Button
                    variant="ghost"
                    size="md"
                    icon={PanelRight}
                    onClick={onToggleSidebar}
                    className={`bg-bg-surface/50 backdrop-blur-md border border-white/5 hover:bg-white/10 text-text-primary ${sidebarOpen ? 'text-brand' : ''}`}
                />
            </div>
        </div>
    );
});
