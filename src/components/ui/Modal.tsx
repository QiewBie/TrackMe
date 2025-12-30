import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { clsx } from 'clsx';
import { motion, AnimatePresence } from 'framer-motion';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    children: React.ReactNode;
    title?: string;
    className?: string;
    showCloseButton?: boolean;
    disableInnerScroll?: boolean;
    fullScreen?: boolean;
}

const Modal: React.FC<ModalProps> = ({
    isOpen,
    onClose,
    children,
    title,
    className,
    showCloseButton = true,
    disableInnerScroll = false,
    fullScreen = false
}) => {
    const backdropRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };

        if (isOpen) {
            document.addEventListener('keydown', handleEscape);
            document.body.style.overflow = 'hidden';
        }

        return () => {
            document.removeEventListener('keydown', handleEscape);
            document.body.style.overflow = 'unset';
        };
    }, [isOpen, onClose]);

    const handleBackdropClick = (e: React.MouseEvent) => {
        if (e.target === backdropRef.current) {
            onClose();
        }
    };

    return createPortal(
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Optimized Backdrop: High Performance - No Blur */}
                    <motion.div
                        key="modal-backdrop"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        ref={backdropRef}
                        onClick={handleBackdropClick}
                        className="fixed inset-0 bg-overlay z-[200]"
                        aria-hidden="true"
                    />

                    {/* Content Layer - Interaction Wrapper */}
                    <div className={clsx(
                        "fixed inset-0 z-[200] flex items-center justify-center pointer-events-none",
                        fullScreen ? "p-0" : "p-4"
                    )}>
                        <motion.div
                            key="modal-content"
                            initial={{ opacity: 0, scale: 0.95, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 10 }}
                            transition={{ duration: 0.2, ease: "easeOut" }}
                            className={clsx(
                                "bg-bg-surface shadow-2xl overflow-hidden flex flex-col pointer-events-auto will-change-transform",
                                fullScreen ? "!w-full !max-w-none !h-full !max-h-screen !rounded-none" : "rounded-2xl w-full max-h-[90vh]",
                                className || "max-w-md"
                            )}
                            onClick={e => e.stopPropagation()}
                        >
                            {(title || showCloseButton) && (
                                <div className="flex items-center justify-between p-4 border-b border-border shrink-0">
                                    {title && <h2 className="text-xl font-bold text-text-primary">{title}</h2>}
                                    {showCloseButton && (
                                        <button
                                            onClick={onClose}
                                            className="p-2 hover:bg-bg-main rounded-full text-text-secondary transition-colors ml-auto"
                                        >
                                            <X size={20} />
                                        </button>
                                    )}
                                </div>
                            )}
                            <div className={clsx(
                                "flex-1 min-h-0",
                                !disableInnerScroll && "overflow-y-auto custom-scrollbar"
                            )}>
                                {children}
                            </div>
                        </motion.div>
                    </div>
                </>
            )}
        </AnimatePresence>,
        document.body
    );
};

export default Modal;
