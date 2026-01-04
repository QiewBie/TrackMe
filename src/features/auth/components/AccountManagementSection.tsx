import { LogOut, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import Button from '../../../components/ui/Button';
import { Heading } from '../../../components/ui/Typography';

interface AccountManagementSectionProps {
    onDeleteProfile?: () => void;
    onLogout?: () => void;
}

export const AccountManagementSection: React.FC<AccountManagementSectionProps> = ({ onDeleteProfile, onLogout }) => {
    const { t } = useTranslation();

    return (
        <div className="bg-bg-surface p-8 rounded-3xl shadow-sm border border-border">
            <Heading variant="h2" className="mb-6 text-left flex items-center gap-2">
                {t('profile.account_management')}
            </Heading>

            <div className="space-y-6">
                {/* Logout Block */}
                {onLogout && (
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-xl bg-bg-main border border-border">
                        <div>
                            <Heading variant="h4" className="mb-1">{t('profile.logout')}</Heading>
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
                <div className="bg-status-error/5 p-4 rounded-xl border border-status-error/10 space-y-4">
                    <div>
                        <Heading variant="h4" className="mb-1 text-status-error">{t('profile.delete_account')}</Heading>
                        <p className="text-sm text-text-secondary">{t('profile.delete_description')}</p>
                    </div>
                    {onDeleteProfile && (
                        <Button
                            variant="secondary"
                            className="w-full sm:w-auto border-status-error/30 text-status-error hover:bg-status-error/10 hover:text-status-error"
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
