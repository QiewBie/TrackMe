import * as React from 'react';
import Modal from '../../../components/ui/Modal';
import { useTranslation } from 'react-i18next';
import { Heading, Text } from '../../../components/ui/Typography';

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

import Toggle from '../../../components/ui/Toggle';

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
                                className={`p-4 rounded-xl border font-bold text-lg transition-all outline-none focus:ring-2 focus:ring-brand-primary/50 ${settings.workDuration === m ? 'bg-brand-primary border-brand-primary text-white shadow-glow' : 'bg-bg-surface border-border hover:border-brand-primary/50 text-text-secondary'}`}
                                style={settings.workDuration === m ? { '--shadow-color': 'var(--brand-primary)' } as React.CSSProperties : {}}
                            >
                                {m} <span className="text-xs font-normal opacity-60 ml-1">{t('common.minutes_short')}</span>
                            </button>
                        ))}
                    </div>
                </section>

                {/* Auto-Start */}
                <section className="p-4 rounded-xl bg-bg-surface/50 border border-border">
                    <Toggle
                        label={t('focus.auto_start_next')}
                        description={t('focus.auto_start_next_desc')}
                        checked={settings.autoStartNext}
                        onChange={(checked) => onUpdateSettings({ ...settings, autoStartNext: checked })}
                    />
                </section>
            </div>
        </Modal>
    );
};
