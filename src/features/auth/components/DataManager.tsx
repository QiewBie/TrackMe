import { useState, useRef } from 'react';
import { Download, Upload, AlertTriangle, Cloud, Info } from 'lucide-react';
import Button from '../../../components/ui/Button';
import { Heading } from '../../../components/ui/Typography';
import ConfirmationModal from '../../../components/shared/ConfirmationModal';
import { useDataPersistence } from '../../../hooks/useDataPersistence';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../../context/AuthContext';

const DataManager: React.FC = () => {
    const { t } = useTranslation();
    const { isGuest, user } = useAuth();
    const { exportData, validateImport, restoreData } = useDataPersistence();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [importCandidate, setImportCandidate] = useState<any>(null);

    const handleImportClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            try {
                const data = await validateImport(file);
                setImportCandidate(data);
            } catch (error) {
                // TODO: Replace with Toast if available in context
                alert((error as Error).message);
            }
            e.target.value = '';
        }
    };

    const confirmImport = () => {
        if (importCandidate) {
            restoreData(importCandidate);
            setImportCandidate(null);
        }
    };

    const showSyncNote = !isGuest && user;

    return (
        <div className="space-y-6">
            <Heading variant="h2" className="flex items-center gap-2">
                {t('profile.data_management')}
            </Heading>

            {/* Status Alert */}
            <div className={`p-4 rounded-2xl flex items-start gap-3 border ${showSyncNote
                ? 'bg-brand-primary/5 border-brand-primary/20 text-brand-primary'
                : 'bg-status-warning/5 border-status-warning/20 text-status-warning'
                }`}>
                {showSyncNote ? (
                    <Cloud size={20} className="shrink-0 mt-0.5" />
                ) : (
                    <AlertTriangle size={20} className="shrink-0 mt-0.5" />
                )}
                <p className="text-sm font-medium leading-relaxed">
                    {showSyncNote ? t('profile.data_sync_note') : t('profile.data_warning')}
                </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
                <Button
                    variant="secondary"
                    size="lg"
                    onClick={exportData}
                    icon={Download}
                    className="flex-1 shadow-sm hover:shadow-md"
                >
                    {t('profile.export_data')}
                </Button>

                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept="application/json"
                    className="hidden"
                />

                <Button
                    variant="secondary"
                    size="lg"
                    onClick={handleImportClick}
                    icon={Upload}
                    className="flex-1 shadow-sm hover:shadow-md"
                >
                    {t('profile.import_data')}
                </Button>
            </div>

            <div className="flex items-center justify-center gap-2 text-text-secondary opacity-60">
                <Info size={14} />
                <p className="text-xs font-medium">
                    {t('profile.import_note')}
                </p>
            </div>

            <ConfirmationModal
                isOpen={!!importCandidate}
                onClose={() => setImportCandidate(null)}
                onConfirm={confirmImport}
                title={t('profile.import_confirm_title')}
                message={t('profile.import_confirm_msg')}
                confirmLabel={t('profile.import_confirm_btn')}
                confirmVariant="danger"
            />
        </div>
    );
};

export default DataManager;
