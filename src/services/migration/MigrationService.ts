/**
 * @deprecated This service is obsolete.
 * Use FinalMigration.ts for V2 transition.
 * Use FinalMigration.run() in app initialization.
 */
export const MigrationService = {
    runMigrations: () => {
        console.warn('[MigrationService] Deprecated. No-op.');
    }
};
