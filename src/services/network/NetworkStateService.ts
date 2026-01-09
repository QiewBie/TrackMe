/**
 * NetworkStateService — Centralized Online/Visibility Management
 * 
 * Single source of truth for:
 * - navigator.onLine status
 * - document.visibilityState
 * - Combined "isActive" state (online AND visible)
 * 
 * All services subscribe to this to pause/resume network operations.
 */

export type NetworkState = {
    isOnline: boolean;
    isVisible: boolean;
    isActive: boolean; // Combined: online AND visible
};

type Listener = (state: NetworkState) => void;

class NetworkStateServiceImpl {
    private _isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
    private _isVisible = typeof document !== 'undefined' ? document.visibilityState === 'visible' : true;
    private listeners = new Set<Listener>();
    private initialized = false;

    constructor() {
        this.init();
    }

    private init(): void {
        if (typeof window === 'undefined' || this.initialized) return;
        this.initialized = true;

        window.addEventListener('online', () => {
            console.log('[NetworkState] Online');
            this.update({ isOnline: true });
        });

        window.addEventListener('offline', () => {
            console.log('[NetworkState] Offline');
            this.update({ isOnline: false });
        });

        document.addEventListener('visibilitychange', () => {
            const visible = document.visibilityState === 'visible';
            console.log(`[NetworkState] Visibility: ${visible ? 'visible' : 'hidden'}`);
            this.update({ isVisible: visible });
        });
    }

    get isOnline(): boolean { return this._isOnline; }
    get isVisible(): boolean { return this._isVisible; }
    get isActive(): boolean { return this._isOnline && this._isVisible; }

    get state(): NetworkState {
        return {
            isOnline: this._isOnline,
            isVisible: this._isVisible,
            isActive: this.isActive
        };
    }

    /**
     * Subscribe to network state changes
     * Callback is immediately invoked with current state
     * Returns unsubscribe function
     */
    subscribe(callback: Listener): () => void {
        this.listeners.add(callback);
        // Immediate call with current state
        callback(this.state);
        return () => this.listeners.delete(callback);
    }

    private update(partial: Partial<{ isOnline: boolean; isVisible: boolean }>): void {
        const prevActive = this.isActive;

        if (partial.isOnline !== undefined) this._isOnline = partial.isOnline;
        if (partial.isVisible !== undefined) this._isVisible = partial.isVisible;

        const state = this.state;

        // Only log on active state change
        if (prevActive !== state.isActive) {
            console.log(`[NetworkState] ${state.isActive ? '✅ Active' : '⏸️ Inactive'} (online=${state.isOnline}, visible=${state.isVisible})`);
        }

        this.listeners.forEach(cb => {
            try {
                cb(state);
            } catch (e) {
                console.error('[NetworkState] Listener error:', e);
            }
        });
    }

    /**
     * Force refresh state (useful after app resume)
     */
    refresh(): void {
        if (typeof navigator !== 'undefined') {
            this._isOnline = navigator.onLine;
        }
        if (typeof document !== 'undefined') {
            this._isVisible = document.visibilityState === 'visible';
        }
        this.listeners.forEach(cb => cb(this.state));
    }
}

// Singleton export
export const networkState = new NetworkStateServiceImpl();
