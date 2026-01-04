import { Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import Button from '../../../components/ui/Button';
import { Heading } from '../../../components/ui/Typography';

interface DangerZoneSectionProps {
    onDeleteProfile: () => void;
}

export const DangerZoneSection: React.FC<DangerZoneSectionProps> = ({ onDeleteProfile }) => {
    const { t } = useTranslation();

    return (
        <div className="pt-6 border-t border-border-subtle mt-6">
            <Heading variant="h3" className="mb-4">{t('profile.danger_zone')}</Heading>
            <div className="bg-status-error/5 p-4 rounded-xl border border-status-error/10 space-y-4">
                <div>
                    <Heading variant="h4" className="mb-1 text-status-error">{t('profile.delete_account')}</Heading>
                    <p className="text-sm text-text-secondary">{t('profile.delete_description')}</p>
                </div>
                <Button
                    variant="secondary"
                    className="w-full sm:w-auto border-status-error/30 text-status-error hover:bg-status-error/10 hover:text-status-error"
                    onClick={onDeleteProfile}
                    icon={Trash2}
                >
                    {t('profile.delete_button')}
                </Button>
            </div>
        </div>
    );
};
