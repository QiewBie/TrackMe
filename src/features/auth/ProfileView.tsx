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
import { Heading } from '../../components/ui/Typography';
import { Container } from '../../components/ui/Layout';
import NavSpacer from '../../components/layout/NavSpacer';

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
        <Container size="xl" className="space-y-6 pt-6 animate-in fade-in duration-500">

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
                                    defaultValue={user.name}
                                    onBlur={e => {
                                        if (e.target.value !== user.name) {
                                            setUser({ ...user, name: e.target.value });
                                        }
                                    }}
                                    className="bg-bg-main border-border font-bold text-center text-lg shadow-sm focus:bg-bg-surface"
                                />
                                <Input
                                    label={t('profile.role_label')}
                                    defaultValue={user.role}
                                    onBlur={e => {
                                        if (e.target.value !== user.role) {
                                            setUser({ ...user, role: e.target.value });
                                        }
                                    }}
                                    className="bg-bg-main border-border text-center text-sm font-medium shadow-sm focus:bg-bg-surface"
                                />

                                <Button
                                    variant="secondary"
                                    onClick={toggleLanguage}
                                    className="w-full justify-between mt-2"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="p-1.5 rounded-lg bg-brand-primary/10 text-brand-primary">
                                            <Languages size={18} />
                                        </div>
                                        <span className="font-semibold text-text-primary text-sm">{t('profile.language', 'Language')}</span>
                                    </div>
                                    <span className="font-bold text-xs bg-bg-surface px-3 py-1 rounded-lg border border-border text-text-primary">
                                        {i18n.language === 'uk' ? t('profile.language_uk', 'UK') : t('profile.language_en', 'EN')}
                                    </span>
                                </Button>
                            </div>
                        </div>
                    </div>

                    {/* Account Management (Desktop: Left Column) */}
                    <div className="hidden lg:block">
                        <AccountManagementSection
                            onLogout={logout}
                            onDeleteProfile={() => setIsDeleteModalOpen(true)}
                        />

                        {/* Troubleshooting (Desktop Only - Left Side) */}
                        <div className="hidden lg:block">
                            <TroubleshootingSection />
                        </div>
                    </div>
                </div>

                {/* Right Column: Key Settings */}
                <div className="lg:col-span-2 space-y-6">

                    {/* Preferences Card */}
                    <div className="bg-bg-surface p-8 rounded-3xl shadow-sm border border-border">
                        <Heading variant="h2" className="mb-6 text-left flex items-center gap-2">
                            {t('profile.preferences')}
                        </Heading>

                        <div className="space-y-6">
                            <Toggle
                                checked={darkMode}
                                onChange={setDarkMode}
                                className="w-full p-4 rounded-xl bg-bg-main border border-border hover:border-brand-primary transition-all group"
                                label={
                                    <div className="flex items-center gap-3">
                                        <div className={clsx("p-2 rounded-lg transition-colors", darkMode ? "bg-brand-primary text-white shadow-glow" : "bg-bg-subtle text-text-secondary")}>
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

                    {/* Account Management (Mobile: Moved to Bottom) */}
                    <div className="lg:hidden">
                        <AccountManagementSection
                            onLogout={logout}
                            onDeleteProfile={() => setIsDeleteModalOpen(true)}
                        />
                    </div>

                    {/* System Status (Desktop Only - Right Side) */}
                    <div className="hidden lg:block bg-bg-surface p-4 rounded-3xl shadow-sm border border-border">
                        <div className="flex items-center justify-between mb-2">
                            <Heading variant="h4" className="flex items-center gap-2 !text-sm">
                                <span className="w-2 h-2 rounded-full bg-status-success animate-pulse"></span>
                                {t('profile.system_status', 'System Status')}
                            </Heading>
                            <span className="text-xs text-text-secondary font-mono">v1.2.0</span>
                        </div>
                        <div className="space-y-2 text-xs text-text-secondary">
                            <div className="flex justify-between">
                                <span>Cloud Sync:</span>
                                <span className={user ? "text-status-success" : "text-ui-disabled"}>
                                    {user ? "Active" : "Offline"}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span>Simple Timer:</span>
                                <span className="text-status-success">Cloud-Enabled</span>
                            </div>
                        </div>
                    </div>

                    {/* Troubleshooting (Mobile Only - Bottom) */}
                    <div className="lg:hidden space-y-6">
                        <div className="bg-bg-surface p-4 rounded-3xl shadow-sm border border-border">
                            <div className="flex items-center justify-between mb-2">
                                <Heading variant="h4" className="flex items-center gap-2 !text-sm">
                                    <span className="w-2 h-2 rounded-full bg-status-success animate-pulse"></span>
                                    {t('profile.system_status', 'System Status')}
                                </Heading>
                                <span className="text-xs text-text-secondary font-mono">v1.2.0</span>
                            </div>
                            <div className="space-y-2 text-xs text-text-secondary">
                                <div className="flex justify-between">
                                    <span>Cloud Sync:</span>
                                    <span className={user ? "text-status-success" : "text-ui-disabled"}>
                                        {user ? "Active" : "Offline"}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Simple Timer:</span>
                                    <span className="text-status-success">Cloud-Enabled</span>
                                </div>
                            </div>
                        </div>

                        <TroubleshootingSection />
                    </div>
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
