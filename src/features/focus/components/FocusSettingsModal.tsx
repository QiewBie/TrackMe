import * as React from 'react';
import Modal from '../../../components/ui/Modal';
import { useTranslation } from 'react-i18next';
import { Text } from '../../../components/ui/Typography';
import Toggle from '../../../components/ui/Toggle';
import { clsx } from 'clsx';
import { Timer, Coffee, Zap } from 'lucide-react';

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

    // Helper for Duration Pills
    const DurationPill = ({ value, current, onChange, label, colorClass = "brand-primary" }: { value: number, current: number, onChange: (v: number) => void, label: string, colorClass?: string }) => {
        const isActive = current === value;
        return (
            <button
                onClick={() => onChange(value)}
                className={clsx(
                    "flex-1 p-3 rounded-xl border font-bold text-lg transition-all outline-none focus:ring-2 relative overflow-hidden",
                    isActive
                        ? `bg-${colorClass} border-${colorClass} text-white shadow-md`
                        : "bg-bg-surface border-border hover:border-border-active text-text-secondary hover:text-text-primary"
                )}
                style={isActive && colorClass === 'brand-primary' ? { '--shadow-color': 'var(--brand-primary)' } as React.CSSProperties : {}}
            >
                <div className="relative z-10 flex flex-col items-center leading-none gap-1">
                    <span>{value}</span>
                    <span className={clsx("text-[10px] font-medium uppercase tracking-wider", isActive ? "opacity-90" : "opacity-50")}>{label}</span>
                </div>
            </button>
        );
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={t('focus.session_settings_title') || "Session Settings"} className="max-w-xl">
            <div className="p-6 space-y-8">

                {/* Section 1: Focus Duration */}
                <section className="space-y-4">
                    <div className="flex items-center gap-2 text-brand-primary">
                        <Timer size={20} />
                        <Text variant="caption" weight="bold" className="uppercase text-text-secondary tracking-wider text-xs">
                            {t('focus.timer_duration')}
                        </Text>
                    </div>

                    <div className="grid grid-cols-4 gap-3">
                        {[25, 45, 60, 90].map(m => (
                            <DurationPill
                                key={m}
                                value={m}
                                current={settings.workDuration}
                                onChange={(v) => onUpdateSettings({ ...settings, workDuration: v })}
                                label={t('common.min_short', 'min')}
                                colorClass="brand-primary"
                            />
                        ))}
                    </div>
                </section>

                <hr className="border-border-subtle" />

                {/* Section 2: Breaks */}
                <section className="space-y-6">
                    <div className="flex items-center gap-2 text-status-success">
                        <Coffee size={20} />
                        <Text variant="caption" weight="bold" className="uppercase text-text-secondary tracking-wider text-xs">
                            Time to Recharge
                        </Text>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Short Break */}
                        <div className="space-y-3">
                            <Text variant="small" weight="bold" className="text-text-primary">
                                {t('focus.break_short', 'Short Break')}
                            </Text>
                            <div className="flex gap-2">
                                {[3, 5, 10].map(m => (
                                    <DurationPill
                                        key={m}
                                        value={m}
                                        current={settings.shortBreak}
                                        onChange={(v) => onUpdateSettings({ ...settings, shortBreak: v })}
                                        label="min"
                                        colorClass="status-success"
                                    />
                                ))}
                            </div>
                        </div>

                        {/* Long Break */}
                        <div className="space-y-3">
                            <Text variant="small" weight="bold" className="text-text-primary">
                                {t('focus.break_long', 'Long Break')}
                            </Text>
                            <div className="flex gap-2">
                                {[15, 20, 30].map(m => (
                                    <DurationPill
                                        key={m}
                                        value={m}
                                        current={settings.longBreak}
                                        onChange={(v) => onUpdateSettings({ ...settings, longBreak: v })}
                                        label="min"
                                        colorClass="status-success"
                                    />
                                ))}
                            </div>
                        </div>
                    </div>
                </section>

                <hr className="border-border-subtle" />

                {/* Section 3: Automation */}
                <section className="p-4 rounded-xl bg-bg-surface/50 border border-border">
                    <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${settings.autoStartNext ? 'bg-brand-primary/10 text-brand-primary' : 'bg-bg-subtle text-text-secondary'}`}>
                            <Zap size={20} />
                        </div>
                        <div className="flex-1">
                            <Toggle
                                label={t('focus.auto_start_next')}
                                description={t('focus.auto_start_next_desc')}
                                checked={settings.autoStartNext}
                                onChange={(checked) => onUpdateSettings({ ...settings, autoStartNext: checked })}
                            />
                        </div>
                    </div>
                </section>
            </div>
        </Modal>
    );
};
