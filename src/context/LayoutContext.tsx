import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

interface MobileHeaderConfig {
    title: ReactNode;
    subtitle?: ReactNode;
    action?: ReactNode;
}

interface LayoutContextType {
    mobileHeader: MobileHeaderConfig;
    setMobileHeader: (config: MobileHeaderConfig) => void;
}

const LayoutContext = createContext<LayoutContextType | undefined>(undefined);

export const LayoutProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [mobileHeader, setMobileHeader] = useState<MobileHeaderConfig>({
        title: 'TrackMe' // Default fallback
    });

    return (
        <LayoutContext.Provider value={{ mobileHeader, setMobileHeader }}>
            {children}
        </LayoutContext.Provider>
    );
};

export const useLayout = () => {
    const context = useContext(LayoutContext);
    if (!context) {
        throw new Error('useLayout must be used within a LayoutProvider');
    }
    return context;
};
