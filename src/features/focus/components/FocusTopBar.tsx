import React, { memo } from 'react';
import { ChevronLeft, Settings, ListMusic, CheckCircle } from 'lucide-react';
import Button from '../../../components/ui/Button';
import AmbienceSelector from '../../../components/shared/AmbienceSelector';
import { useTranslation } from 'react-i18next';
import { LAYOUT } from '../../../constants/layout';

interface FocusTopBarProps {
    isTimerRunning: boolean;
    controlsVisible: boolean;
    isZenMode: boolean;
    setZenMode: (val: boolean) => void;
    sidebarOpen: boolean;
    onOpenSettings: () => void;
    onToggleSidebar: () => void;
    onBack: () => void;
}

export const FocusTopBar: React.FC<FocusTopBarProps> = memo(({
    isTimerRunning,
    controlsVisible,
    isZenMode,
    setZenMode,
    sidebarOpen,
    onOpenSettings,
    onToggleSidebar,
    onBack
}) => {
    const { t } = useTranslation();

    const buttonClass = "bg-bg-surface/50 backdrop-blur-md border border-border-subtle hover:bg-bg-surface hover:text-brand hover:border-brand-primary/30 hover:shadow-md text-text-primary w-10 h-10 rounded-full shadow-sm flex items-center justify-center !p-0";

    return (
        <div
            className={`
                absolute top-0 left-0 right-0 z-50 px-4 md:px-6 h-16 flex items-center justify-between
                transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] safe-area-top pt-safe
                ${(isTimerRunning && !controlsVisible) ? 'opacity-0 -translate-y-4 pointer-events-none' : 'opacity-100 translate-y-0'}
                ${sidebarOpen ? LAYOUT.FOCUS.TOPBAR_SHIFT_CLASS : ''}
            `}
            onClick={(e) => e.stopPropagation()}
        >
            {/* Left: Back Button */}
            <div className="flex items-center z-10 md:hidden">
                <Button
                    variant="ghost"
                    size="sm"
                    icon={ChevronLeft}
                    onClick={onBack}
                    title={t('common.back')}
                    className={buttonClass}
                />
            </div>


            {/* Right: Controls */}
            <div className="flex items-center gap-2 md:gap-3 z-10">
                <div>
                    <AmbienceSelector />
                </div>

                <div className="flex items-center gap-1.5">
                    <Button
                        variant="ghost"
                        size="sm"
                        icon={Settings}
                        onClick={onOpenSettings}
                        className={buttonClass}
                    />
                    <Button
                        variant="ghost"
                        size="sm"
                        icon={ListMusic}
                        onClick={onToggleSidebar}
                        className={`${buttonClass} ${sidebarOpen ? 'text-brand ring-1 ring-brand/20 bg-brand/5' : ''}`}
                    />
                </div>
            </div>
        </div>
    );
});
