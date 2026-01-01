import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AlertCircle, ChevronDown, ChevronRight, Database, RefreshCw } from 'lucide-react';
import Button from '../../../components/ui/Button';

export const TroubleshootingSection = () => {
    const { t } = useTranslation();
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="border-t border-border-subtle pt-6 mt-8">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 text-text-secondary hover:text-text-primary transition-colors text-sm font-medium w-full group"
            >
                {isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                <AlertCircle size={16} className="text-status-warning" />
                <span>{t('common.troubleshoot')}</span>
            </button>

            {isOpen && (
                <div className="mt-4 p-4 bg-bg-surface rounded-xl border border-border space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
                    <p className="text-xs text-text-secondary">
                        {t('common.troubleshoot_desc')}
                    </p>

                    <div className="flex flex-col gap-2">
                        <Button
                            variant="secondary"
                            onClick={async () => {
                                if (confirm(t('common.reset_cache_confirm'))) {
                                    try {
                                        const { db } = await import('../../../lib/firebase');
                                        const { clearIndexedDbPersistence, terminate } = await import('firebase/firestore');

                                        await terminate(db);
                                        await clearIndexedDbPersistence(db);

                                        console.log("Cache cleared. Reloading...");
                                        window.location.reload();
                                    } catch (e) {
                                        console.error(e);
                                        alert(t('common.reset_cache_error'));
                                    }
                                }
                            }}
                            className="w-full justify-start text-xs"
                            icon={RefreshCw}
                        >
                            {t('common.reset_cache')}
                        </Button>

                        <div className="pt-2 border-t border-border-subtle mt-2">
                            <p className="text-xs font-mono text-text-disabled mb-2 uppercase tracking-wider">{t('common.debug_label')}</p>
                            <Button
                                variant="secondary"
                                size="sm"
                                onClick={async () => {
                                    const { db, auth } = await import('../../../lib/firebase');
                                    const { doc, getDoc, deleteDoc } = await import('firebase/firestore');
                                    if (!auth.currentUser) return;

                                    const docRef = doc(db, 'users', auth.currentUser.uid, 'data', 'preferences');
                                    const snap = await getDoc(docRef);
                                    const data = snap.exists() ? snap.data() : "No Document Found";
                                    console.log("Raw Firestore Data:", data);
                                    alert(t('common.debug_data') + JSON.stringify(data, null, 2));

                                    if (confirm(t('common.nuke_confirm'))) {
                                        await deleteDoc(docRef);
                                        alert(t('common.nuke_deleted'));
                                        window.location.reload();
                                    }
                                }}
                                className="w-full justify-start text-xs"
                                icon={Database}
                            >
                                {t('common.inspect_data')}
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
