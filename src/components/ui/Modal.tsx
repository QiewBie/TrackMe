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
}

const Modal: React.FC<ModalProps> = ({
    isOpen,
    onClose,
    children,
    title,
    className,
    showCloseButton = true,
    disableInnerScroll = false
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

    // Removed early return to allow AnimatePresence to work
    // if (!isOpen) return null;

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
                        className="fixed inset-0 bg-black/60 z-[200]"
                        aria-hidden="true"
                    />

                    {/* Content Layer - Interaction Wrapper */}
                    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 pointer-events-none">
                        <motion.div
                            key="modal-content"
                            initial={{ opacity: 0, scale: 0.95, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 10 }}
                            transition={{ duration: 0.2, ease: "easeOut" }}
                            className={clsx(
                                "bg-bg-surface rounded-2xl shadow-2xl w-full max-h-[90vh] overflow-hidden flex flex-col pointer-events-auto will-change-transform",
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
