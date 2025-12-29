import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import Button from '../ui/Button';
import { LogIn } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const LoginView: React.FC = () => {
    const { loginWithGoogle, continueAsGuest, user, isLoading } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const { t } = useTranslation();

    const from = (location.state as any)?.from?.pathname || '/';

    React.useEffect(() => {
        if (user) {
            navigate(from, { replace: true });
        }
    }, [user, navigate, from]);

    if (isLoading) return <div className="h-screen w-full flex items-center justify-center bg-bg-main text-text-primary">{t('common.loading')}</div>;

    return (
        <div className="min-h-screen w-full flex items-center justify-center bg-bg-main text-text-primary relative overflow-hidden">
            {/* Background Effects */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-brand-primary/20 rounded-full blur-[100px]" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-brand-secondary/20 rounded-full blur-[100px]" />
            </div>

            <div className="z-10 bg-bg-surface p-8 rounded-card shadow-2xl max-w-md w-full border border-border text-center space-y-8">
                <div className="space-y-2">
                    <h1 className="text-4xl font-black bg-clip-text text-transparent bg-gradient-to-r from-brand-primary via-brand-tertiary to-brand-secondary">
                        Deep Flow
                    </h1>
                    <p className="text-text-secondary">
                        {t('auth.subtitle', 'Synchronize your focus across devices.')}
                    </p>
                </div>

                <div className="space-y-4">
                    <Button
                        onClick={() => loginWithGoogle()}
                        className="w-full py-4 text-lg font-bold bg-bg-surface text-text-primary border border-border hover:opacity-90 transition-all shadow-lg hover:shadow-xl"
                        icon={LogIn}
                    >
                        {t('auth.google_login', 'Sign in with Google')}
                    </Button>

                    <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t border-border" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-bg-surface px-2 text-text-secondary">
                                {t('auth.or', 'Or')}
                            </span>
                        </div>
                    </div>

                    <Button
                        onClick={() => continueAsGuest()}
                        className="w-full py-3 bg-bg-main text-text-secondary hover:text-text-primary"
                        variant="secondary"
                    >
                        {t('auth.guest', 'Continue as Guest')}
                    </Button>
                </div>

                <p className="text-xs text-text-secondary max-w-xs mx-auto">
                    {t('auth.disclaimer', 'By continuing, you acknowledge that Guest data is stored locally on this device only.')}
                </p>
            </div>
        </div>
    );
};

export default LoginView;
