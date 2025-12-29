import React from 'react';
import { User, Camera, Save, LogOut, Trash2, Moon, Sun, Languages } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Button from '../ui/Button';
import Input from '../ui/Input';
import ConfirmationModal from '../shared/ConfirmationModal';
import DataManager from '../profile/DataManager';
import { User as UserType } from '../../types';
import { useTranslation } from 'react-i18next';
import { useUI } from '../../context/UIContext';
import { clsx } from 'clsx';
import PageHeader from '../ui/PageHeader';

interface ProfileViewProps {
    user: UserType;
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

    const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            updateAvatar(e.target.files[0]);
        }
    };

    const toggleLanguage = () => {
        const newLang = i18n.language === 'uk' ? 'en' : 'uk';
        i18n.changeLanguage(newLang);
    };

    return (
        <div className="max-w-6xl mx-auto space-y-6 animate-slide-in">

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

                {/* Left Column: Profile Card */}
                <div className="lg:col-span-1 space-y-6 text-center">
                    <div className="bg-bg-surface p-8 rounded-3xl shadow-sm border border-border relative overflow-hidden group">

                        {/* Decorative Background */}
                        <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-br from-brand-primary/10 to-brand-secondary/10 pointer-events-none"></div>

                        <div className="relative relative z-10 flex flex-col items-center">
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
                            </div>
                        </div>
                    </div>

                    <div className="bg-bg-surface p-6 rounded-3xl border border-border shadow-sm">
                        <h3 className="text-lg font-bold text-text-primary mb-4 text-left flex items-center gap-2">
                            {t('profile.preferences')}
                        </h3>
                        <div className="space-y-3">
                            <button
                                onClick={() => setDarkMode(!darkMode)}
                                className="w-full flex items-center justify-between p-3 rounded-xl bg-bg-main border border-border hover:border-brand-primary transition-all group"
                            >
                                <div className="flex items-center gap-3">
                                    <div className={clsx("p-2 rounded-lg transition-colors", darkMode ? "bg-bg-inverse text-text-inverse" : "bg-bg-subtle text-text-secondary")}>
                                        {darkMode ? <Moon size={18} /> : <Sun size={18} />}
                                    </div>
                                    <span className="font-semibold text-text-primary">{darkMode ? t('navigation.dark_theme') : t('navigation.light_theme')}</span>
                                </div>
                                <div className={clsx("w-10 h-6 rounded-full relative transition-colors", darkMode ? "bg-brand-primary" : "bg-ui-disabled")}>
                                    <div className={clsx("absolute top-1 w-4 h-4 rounded-full bg-white transition-transform duration-300", darkMode ? "left-5" : "left-1")} />
                                </div>
                            </button>

                            <button
                                onClick={toggleLanguage}
                                className="w-full flex items-center justify-between p-3 rounded-xl bg-bg-main border border-border hover:border-brand-primary transition-all group"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-lg bg-brand-primary/10 text-brand-primary">
                                        <Languages size={18} />
                                    </div>
                                    <span className="font-semibold text-text-primary">{t('profile.language', 'Language')}</span>
                                </div>
                                <span className="font-bold text-sm bg-bg-surface px-3 py-1 rounded-lg border border-border text-text-primary">
                                    {i18n.language === 'uk' ? t('profile.language_uk', 'Українська') : t('profile.language_en', 'English')}
                                </span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Right Column: Data & Actions */}
                <div className="lg:col-span-2 space-y-6">

                    {/* Data Manager */}
                    <div className="bg-bg-surface p-8 rounded-3xl shadow-sm border border-border">
                        <DataManager />
                    </div>

                    {/* Danger Zone - Softened */}
                    <div className="border border-status-error/20 p-8 rounded-3xl bg-status-error/5">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 bg-status-error/10 text-status-error rounded-lg">
                                <Trash2 size={20} />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-text-primary">{t('profile.danger_zone')}</h3>
                                <p className="text-sm text-text-secondary">{t('profile.danger_warning')}</p>
                            </div>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-4">
                            {logout && (
                                <Button
                                    onClick={logout}
                                    variant="secondary"
                                    size="lg"
                                    icon={LogOut}
                                    className="flex-1"
                                >
                                    {t('profile.logout')}
                                </Button>
                            )}
                            {deleteProfile && (
                                <Button
                                    onClick={() => setIsDeleteModalOpen(true)}
                                    variant="danger"
                                    size="lg"
                                    icon={Trash2}
                                    className="flex-1"
                                >
                                    {t('profile.delete_account')}
                                </Button>
                            )}
                        </div>
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
        </div>
    );
};

export default ProfileView;
