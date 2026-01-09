import { lazy, ComponentType } from 'react';

/**
 * lazyWithRetry
 * 
 * A wrapper around React.lazy that handles chunk load errors (Version Mismatch).
 * If a new deployment happens, old chunks might be deleted. 
 * This wrapper catches the chunk load error and forces a page reload to get the new index.html.
 */
export const lazyWithRetry = <T extends ComponentType<any>>(
    factory: () => Promise<{ default: T }>
) => {
    return lazy(async () => {
        try {
            return await factory();
        } catch (error: any) {
            const message = String(error).toLowerCase();
            // Check for chunk load errors or MIME type errors
            if (
                message.includes('loading chunk') ||
                message.includes('mime type') ||
                message.includes('text/html') ||
                message.includes('failed to fetch')
            ) {
                // Prevent infinite reload loop
                const hasReloaded = sessionStorage.getItem('has_reloaded_for_update');
                if (!hasReloaded) {
                    console.log('[LazyRetry] Chunk load failed, reloading to get new version...');
                    sessionStorage.setItem('has_reloaded_for_update', 'true');
                    window.location.reload();
                    // Return a never-resolving promise to keep Suspense in pending state during reload
                    return new Promise(() => { });
                }
            }
            throw error;
        }
    });
};

// Clear the flag on successful load
if (typeof window !== 'undefined') {
    window.addEventListener('load', () => {
        sessionStorage.removeItem('has_reloaded_for_update');
    });
}
