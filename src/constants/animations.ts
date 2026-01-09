export const ANIMATION_DURATION = {
    FAST: 0.2,   // Micro-interactions, drops, modals
    MEDIUM: 0.3, // Page transitions, cards, sidebars
    SLOW: 0.5,   // Complex layout shifts
    ENTER: 0.4,  // Entrance animations
};

export const TRANSITIONS = {
    DEFAULT: { duration: ANIMATION_DURATION.MEDIUM, ease: 'easeOut' },
    MODAL: { duration: ANIMATION_DURATION.FAST, ease: 'easeOut' },
    SPRING: { type: "spring", stiffness: 300, damping: 30 },
};
