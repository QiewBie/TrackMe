import React from 'react';
import Button from '../ui/Button';
import Modal from '../ui/Modal';
import { useTranslation } from 'react-i18next';

interface ConfirmationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    confirmLabel?: string;
    confirmVariant?: 'danger' | 'primary' | 'secondary';
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmLabel,
    confirmVariant = 'danger'
}) => {
    const { t } = useTranslation();
    // Removed early return to let Modal handle animation via AnimatePresence
    // if (!isOpen) return null;

    const getVariantClass = () => {
        switch (confirmVariant) {
            case 'primary': return 'bg-brand-primary hover:bg-brand-secondary shadow-brand/20';
            case 'secondary': return 'bg-bg-subtle hover:bg-bg-emphasized text-text-primary shadow-sm border border-border';
            default: return 'bg-status-error hover:opacity-90 shadow-status-error/20';
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            className="max-w-sm"
            showCloseButton={false}
        >
            <div className="p-6">
                <h3 className="text-xl font-bold text-text-primary mb-2">{title}</h3>
                <p className="text-text-secondary mb-6">{message}</p>
                <div className="flex justify-end gap-3">
                    <Button variant="secondary" onClick={onClose}>Скасувати</Button>
                    <button
                        onClick={() => { onConfirm(); onClose(); }}
                        className={`px-4 py-2 text-white rounded-xl font-bold transition-colors shadow-sm ${getVariantClass()}`}
                    >
                        {confirmLabel}
                    </button>
                </div>
            </div>
        </Modal>
    );
};

export default ConfirmationModal;
