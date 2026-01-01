import * as React from 'react';
import { User, Camera, Save, LogOut, Moon, Sun, Languages } from 'lucide-react';
import { ThemeSelector } from '../settings/components/ThemeSelector';
import { useNavigate } from 'react-router-dom';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Toggle from '../../components/ui/Toggle';
import ConfirmationModal from '../../components/shared/ConfirmationModal';
import DataManager from './components/DataManager';
import { TroubleshootingSection } from './components/TroubleshootingSection';
import { AccountManagementSection } from './components/AccountManagementSection';
import { User as UserType } from '../../types';
import { useTranslation } from 'react-i18next';
import { useUI } from '../../context/UIContext';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { clsx } from 'clsx';
import PageHeader from '../../components/ui/PageHeader';
import { Container } from '../../components/ui/Layout';

interface ProfileViewProps {
    user: UserType | null;
    setUser: (user: UserType) => void;
    updateAvatar: (file: File) => void;
    logout?: () => void;
    deleteProfile?: () => void;
}

const ProfileView: React.FC<ProfileViewProps> = ({ user, setUser, updateAvatar, logout, deleteProfile }) => {
    const navigate = useNavigate();
    const { t, i18n } = useTranslation();
    const { darkMode, setDarkMode } = useUI();
    const [isDeleteModalOpen, setIsDeleteModalOpen] = React.useState(false);

    if (!user) return null;

    const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            updateAvatar(e.target.files[0]);
        }
    };

    const { setLanguage, language } = useTheme();

    const toggleLanguage = () => {
        const newLang = language === 'uk' ? 'en' : 'uk';
        setLanguage(newLang);
    };

    return (
        <Container size="xl" className="space-y-6 py-6 pb-20 animate-in fade-in duration-500">

            {/* Header */}
            <PageHeader
                title={t('profile.title')}
                subtitle={t('profile.subtitle')}
                action={
                    <Button onClick={() => navigate('/')} variant="primary" icon={Save}>
                        {t('profile.save_button')}
                    </Button>
                }
            />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8 items-start">

                {/* Left Column: Profile Card & Actions */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-bg-surface p-8 rounded-3xl shadow-sm border border-border relative overflow-hidden group">

                        {/* Decorative Background */}
                        <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-br from-brand-primary/10 to-brand-secondary/10 pointer-events-none"></div>

                        <div className="relative z-10 flex flex-col items-center">
                            <label className="relative cursor-pointer group/avatar w-40 h-40 mb-6">
                                <div className="w-full h-full rounded-full overflow-hidden bg-bg-main border-4 border-bg-surface shadow-2xl transition-transform md:group-hover/avatar:scale-105 duration-300">
                                    {user.avatar ?
                                        <img src={user.avatar} alt="Avatar" className="w-full h-full object-cover" /> :
                                        <div className="w-full h-full flex items-center justify-center bg-bg-main">
                                            <User className="w-16 h-16 text-ui-disabled" />
                                        </div>
                                    }
                                </div>
                                <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 md:group-hover/avatar:opacity-100 transition-opacity duration-300 text-white backdrop-blur-sm pointer-events-none md:pointer-events-auto">
                                    <Camera size={32} className="animate-bounce" />
                                </div>
                                <input type="file" className="hidden" accept="image/*" onChange={handleAvatarUpload} />
                            </label>

                            <div className="w-full space-y-4">
                                <Input
                                    label={t('profile.name_label')}
                                    value={user.name}
                                    onChange={e => setUser({ ...user, name: e.target.value })}
                                    className="bg-bg-main border-border font-bold text-center text-lg shadow-sm focus:bg-bg-surface"
                                />
                                <Input
                                    label={t('profile.role_label')}
                                    value={user.role}
                                    onChange={e => setUser({ ...user, role: e.target.value })}
                                    className="bg-bg-main border-border text-center text-sm font-medium shadow-sm focus:bg-bg-surface"
                                />

                                <button
                                    onClick={toggleLanguage}
                                    className="w-full flex items-center justify-between p-3 rounded-xl bg-bg-main border border-border hover:border-brand-primary transition-all group mt-2"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 rounded-lg bg-brand-primary/10 text-brand-primary">
                                            <Languages size={18} />
                                        </div>
                                        <span className="font-semibold text-text-primary text-sm">{t('profile.language', 'Language')}</span>
                                    </div>
                                    <span className="font-bold text-xs bg-bg-surface px-3 py-1 rounded-lg border border-border text-text-primary">
                                        {i18n.language === 'uk' ? t('profile.language_uk', 'UK') : t('profile.language_en', 'EN')}
                                    </span>
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Account Management (Moved to Left Column) */}
                    <AccountManagementSection
                        onLogout={logout}
                        onDeleteProfile={() => setIsDeleteModalOpen(true)}
                    />
                </div>

                {/* Right Column: Key Settings */}
                <div className="lg:col-span-2 space-y-6">

                    {/* Preferences Card */}
                    <div className="bg-bg-surface p-8 rounded-3xl shadow-sm border border-border">
                        <h2 className="text-xl font-bold text-text-primary mb-6 text-left flex items-center gap-2">
                            {t('profile.preferences')}
                        </h2>

                        <div className="space-y-6">
                            <Toggle
                                checked={darkMode}
                                onChange={setDarkMode}
                                className="w-full p-4 rounded-xl bg-bg-main border border-border hover:border-brand-primary transition-all group"
                                label={
                                    <div className="flex items-center gap-3">
                                        <div className={clsx("p-2 rounded-lg transition-colors", darkMode ? "bg-bg-inverse text-text-inverse" : "bg-bg-subtle text-text-secondary")}>
                                            {darkMode ? <Moon size={20} /> : <Sun size={20} />}
                                        </div>
                                        <span className="font-bold text-lg text-text-primary">{darkMode ? t('navigation.dark_theme') : t('navigation.light_theme')}</span>
                                    </div>
                                }
                            />
                            <ThemeSelector />
                        </div>
                    </div>

                    {/* Data Manager */}
                    <div className="bg-bg-surface p-8 rounded-3xl shadow-sm border border-border">
                        <DataManager />
                    </div>

                    {/* Troubleshooting (Bottom Dropdown) */}
                    <TroubleshootingSection />

                </div>
            </div>

            <ConfirmationModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={() => {
                    deleteProfile?.();
                    setIsDeleteModalOpen(false);
                }}
                title={t('profile.delete_account')}
                message={t('profile.delete_confirm_msg')}
                confirmLabel={t('profile.delete_account')}
                confirmVariant="danger"
            />
        </Container >
    );
};

export default ProfileView;
