import React from 'react';
import Button from '../ui/Button';
import Modal from '../ui/Modal';

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
    confirmLabel = "Видалити",
    confirmVariant = 'danger'
}) => {
    // Removed early return to let Modal handle animation via AnimatePresence
    // if (!isOpen) return null;

    const getVariantClass = () => {
        switch (confirmVariant) {
            case 'primary': return 'bg-blue-600 hover:bg-blue-700 shadow-blue-500/20';
            case 'secondary': return 'bg-slate-600 hover:bg-slate-700 shadow-slate-500/20';
            default: return 'bg-red-500 hover:bg-red-600 shadow-red-500/20';
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
