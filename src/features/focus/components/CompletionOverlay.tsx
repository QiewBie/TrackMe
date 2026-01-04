import * as React from 'react';
import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, Trophy, Timer, ArrowRight, X } from 'lucide-react';
import confetti from 'canvas-confetti';
import Button from '../../../components/ui/Button';
import { Heading, Text } from '../../../components/ui/Typography';

/* 
  Standardized Completion Overlay
  - Uses Portal for fullscreen
  - Handles Confetti
  - Consistent Animations
*/

interface ActionButton {
    label: string;
    onClick: () => void;
    variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
}

interface CompletionOverlayProps {
    isOpen: boolean;
    title: string;
    message: string;
    type?: 'session' | 'playlist' | 'milestone';
    primaryAction?: ActionButton;
    secondaryAction?: ActionButton;
    stats?: { label: string; value: string | number; icon?: React.ElementType }[];
}

export const CompletionOverlay: React.FC<CompletionOverlayProps> = ({
    isOpen,
    title,
    message,
    type = 'session',
    primaryAction,
    secondaryAction,
    stats
}) => {
    // Confetti Effect - Optimized
    useEffect(() => {
        if (isOpen) {
            const defaults = { zIndex: 10000, disableForReducedMotion: true };

            if (type === 'playlist' || type === 'milestone') {
                // Single optimized burst for big celebrations
                const count = 200;
                const origin = { y: 0.7 };

                function fire(particleRatio: number, opts: any) {
                    confetti({
                        ...defaults,
                        ...opts,
                        particleCount: Math.floor(count * particleRatio),
                        origin
                    });
                }

                fire(0.25, { spread: 26, startVelocity: 55 });
                fire(0.2, { spread: 60 });
                fire(0.35, { spread: 100, decay: 0.91, scalar: 0.8 });
                fire(0.1, { spread: 120, startVelocity: 25, decay: 0.92, scalar: 1.2 });
                fire(0.1, { spread: 120, startVelocity: 45 });

            } else {
                // Small subtle burst for session completion
                confetti({
                    ...defaults,
                    particleCount: 50,
                    spread: 60,
                    origin: { y: 0.7 },
                    scalar: 0.7
                });
            }
        }
    }, [isOpen, type]);

    if (!isOpen) return null;

    return createPortal(
        <div className="fixed inset-0 z-toast flex items-center justify-center p-6 bg-bg-main">
            {/* Background Ambience - No Blur */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full opacity-10 animate-pulse-slow"
                    style={{
                        background: `radial-gradient(circle, ${type === 'playlist' ? 'hsl(var(--status-success) / 0.4)' : 'hsl(var(--brand-primary) / 0.4)'} 0%, transparent 70%)`
                    }}
                />
            </div>

            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.3, ease: 'easeOut' }}
                className="relative z-10 w-full max-w-md flex flex-col items-center text-center"
            >
                {/* Icon Circle */}
                <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.1, duration: 0.4 }}
                    className={`w-20 h-20 rounded-full flex items-center justify-center mb-8 shadow-xl relative group ${type === 'playlist' ? 'bg-status-success/10 text-status-success ring-4 ring-status-success/10' : 'bg-brand-primary/10 text-brand-primary ring-4 ring-brand-primary/10'
                        }`}
                >
                    {type === 'playlist' ? (
                        <Trophy size={40} strokeWidth={2.5} />
                    ) : (
                        <CheckCircle size={40} strokeWidth={2.5} />
                    )}
                </motion.div>

                {/* Text Content */}
                <div className="space-y-3 mb-10">
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                    >
                        <Heading variant="h2" className="text-3xl font-bold tracking-tight text-text-primary">
                            {title}
                        </Heading>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.3 }}
                    >
                        <Text className="text-lg text-text-secondary max-w-sm mx-auto leading-relaxed">
                            {message}
                        </Text>
                    </motion.div>
                </div>

                {/* Stats Grid (Optional) */}
                {stats && stats.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                        className="grid grid-cols-2 gap-3 w-full mb-8"
                    >
                        {stats.map((stat, idx) => (
                            <div key={idx} className="bg-bg-surface border border-border/50 p-4 rounded-xl flex flex-col items-center">
                                {stat.icon && <stat.icon size={18} className="text-text-tertiary mb-2" />}
                                <span className="text-xl font-bold text-text-primary">{stat.value}</span>
                                <span className="text-xs font-bold uppercase tracking-wider text-text-secondary">{stat.label}</span>
                            </div>
                        ))}
                    </motion.div>
                )}

                {/* Actions */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="flex flex-col w-full gap-3"
                >
                    {primaryAction && (
                        <Button
                            onClick={primaryAction.onClick}
                            variant={primaryAction.variant || 'primary'}
                            size="lg"
                            className="w-full shadow-lg hover:shadow-xl" // Keep shadow, remove fixed size
                            icon={ArrowRight}
                        >
                            {primaryAction.label}
                        </Button>
                    )}
                    {secondaryAction && (
                        <Button
                            onClick={secondaryAction.onClick}
                            variant={secondaryAction.variant || 'ghost'}
                            size="md" // Use medium for secondary to reduce visual weight or keep lg if desired
                            className="w-full"
                        >
                            {secondaryAction.label}
                        </Button>
                    )}
                </motion.div>

            </motion.div>
        </div>,
        document.body
    );
};
