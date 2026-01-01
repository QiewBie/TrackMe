import { LogOut, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import Button from '../../../components/ui/Button';

interface AccountManagementSectionProps {
    onDeleteProfile?: () => void;
    onLogout?: () => void;
}

export const AccountManagementSection: React.FC<AccountManagementSectionProps> = ({ onDeleteProfile, onLogout }) => {
    const { t } = useTranslation();

    return (
        <div className="bg-bg-surface p-8 rounded-3xl shadow-sm border border-border">
            <h2 className="text-xl font-bold text-text-primary mb-6 text-left flex items-center gap-2">
                {t('profile.account_management')}
            </h2>

            <div className="space-y-6">
                {/* Logout Block */}
                {onLogout && (
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-xl bg-bg-main border border-border">
                        <div>
                            <h4 className="font-medium text-text-primary mb-1">{t('profile.logout')}</h4>
                            <p className="text-sm text-text-secondary">{t('auth.subtitle')}</p>
                        </div>
                        <Button
                            onClick={onLogout}
                            variant="secondary"
                            size="md"
                            icon={LogOut}
                            className="w-full sm:w-auto shrink-0"
                        >
                            {t('profile.logout')}
                        </Button>
                    </div>
                )}

                {/* Delete Account Block */}
                <div className="bg-red-500/5 p-4 rounded-xl border border-red-500/10 space-y-4">
                    <div>
                        <h4 className="font-medium text-red-600 mb-1">{t('profile.delete_account')}</h4>
                        <p className="text-sm text-text-secondary">{t('profile.delete_description')}</p>
                    </div>
                    {onDeleteProfile && (
                        <Button
                            variant="secondary"
                            className="w-full sm:w-auto border-red-500/30 text-red-500 hover:bg-red-500/10 hover:text-red-600"
                            onClick={onDeleteProfile}
                            icon={Trash2}
                        >
                            {t('profile.delete_button')}
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
};
