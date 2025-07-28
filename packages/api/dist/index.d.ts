export * from './firebase';
export { RegistrationService } from './services/RegistrationService';
export { VerificationService } from './services/VerificationService';
export { SettingsManager } from './services/SettingsManager';
export type * from './types/settings';
export type Category = {
    id: string;
    name: string;
    slug: string;
};
export declare const getCategories: () => Promise<Category[]>;
