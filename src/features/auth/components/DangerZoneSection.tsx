import { Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import Button from '../../../components/ui/Button';

interface DangerZoneSectionProps {
    onDeleteProfile: () => void;
}

export const DangerZoneSection: React.FC<DangerZoneSectionProps> = ({ onDeleteProfile }) => {
    const { t } = useTranslation();

    return (
        <div className="pt-6 border-t border-border-subtle mt-6">
            <h3 className="text-lg font-semibold text-text-primary mb-4">{t('profile.danger_zone')}</h3>
            <div className="bg-red-500/5 p-4 rounded-xl border border-red-500/10 space-y-4">
                <div>
                    <h4 className="font-medium text-red-600 mb-1">{t('profile.delete_account')}</h4>
                    <p className="text-sm text-text-secondary">{t('profile.delete_description')}</p>
                </div>
                <Button
                    variant="secondary"
                    className="w-full sm:w-auto border-red-500/30 text-red-500 hover:bg-red-500/10 hover:text-red-600"
                    onClick={onDeleteProfile}
                    icon={Trash2}
                >
                    {t('profile.delete_button')}
                </Button>
            </div>
        </div>
    );
};
