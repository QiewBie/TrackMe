import React from 'react';
import Modal from '../ui/Modal';
import { useTranslation } from 'react-i18next';
import { Heading, Text } from '../ui/Typography';

interface FocusSettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    settings: {
        workDuration: number;
        shortBreak: number;
        longBreak: number;
        autoStartNext: boolean;
    };
    onUpdateSettings: (newSettings: any) => void;
}

export const FocusSettingsModal: React.FC<FocusSettingsModalProps> = ({ isOpen, onClose, settings, onUpdateSettings }) => {
    const { t } = useTranslation();

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={t('focus.session_settings_title') || "Session Settings"} className="max-w-md">
            <div className="p-6 space-y-8">
                {/* Timer Duration */}
                <section className="space-y-4">
                    <Text variant="caption" weight="bold" className="uppercase text-text-secondary/60 tracking-wider text-xs">
                        {t('focus.timer_duration')}
                    </Text>
                    <div className="grid grid-cols-2 gap-3">
                        {[25, 45, 60, 90].map(m => (
                            <button
                                key={m}
                                onClick={() => onUpdateSettings({ ...settings, workDuration: m })}
                                className={`p-4 rounded-xl border font-bold text-lg transition-all ${settings.workDuration === m ? 'bg-brand border-brand text-white shadow-glow' : 'bg-bg-surface border-border hover:border-brand/50 text-text-secondary'}`}
                                style={settings.workDuration === m ? { '--shadow-color': 'var(--brand-primary)' } as React.CSSProperties : {}}
                            >
                                {m} <span className="text-xs font-normal opacity-60 ml-1">{t('common.minutes_short')}</span>
                            </button>
                        ))}
                    </div>
                </section>

                {/* Auto-Start */}
                <section className="flex items-center justify-between p-4 rounded-xl bg-bg-surface/50 border border-border">
                    <div className="space-y-1">
                        <Text className="text-text-primary font-medium">{t('focus.auto_start_next')}</Text>
                        <Text className="text-xs text-text-secondary">{t('focus.auto_start_next_desc')}</Text>
                    </div>
                    <button
                        onClick={() => onUpdateSettings({ ...settings, autoStartNext: !settings.autoStartNext })}
                        className={`w-12 h-6 rounded-full transition-colors relative ${settings.autoStartNext ? 'bg-brand' : 'bg-bg-surface border border-text-secondary/30'}`}
                    >
                        <div className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${settings.autoStartNext ? 'translate-x-6' : 'translate-x-0'}`} />
                    </button>
                </section>
            </div>
        </Modal>
    );
};
