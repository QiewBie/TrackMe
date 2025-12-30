import * as React from 'react';
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

const ConfirmationModal = ({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmLabel,
    confirmVariant = 'danger'
}: ConfirmationModalProps) => {
    const { t } = useTranslation();

    // Default label logic
    const finalConfirmLabel = confirmLabel || (confirmVariant === 'danger' ? t('common.delete', 'Delete') : t('common.confirm', 'Confirm'));

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
                    <Button variant="secondary" onClick={onClose}>{t('common.cancel', 'Cancel')}</Button>
                    <Button
                        onClick={() => { onConfirm(); onClose(); }}
                        variant={confirmVariant}
                    >
                        {finalConfirmLabel}
                    </Button>
                </div>
            </div>
        </Modal>
    );
};

export default ConfirmationModal;
