import { Requirement } from '../types';

export type Language = 'en' | 'bn';

export const getRequirementTitle = (requirement: Requirement, language: Language): string => {
  return language === 'bn' ? requirement.title_bn : requirement.title_en;
};

// Lightweight translation key infrastructure for future UI labels
export const translations = {
  en: {
    status_missing: 'Missing',
    status_expiry_date_needed: 'Expiry date needed',
    status_expired: 'Expired',
    status_not_provided: 'Not provided',
    status_ok: 'OK',
    generate_package: 'Generate Package',
  },
  bn: {
    status_missing: 'অনুপস্থিত',
    status_expiry_date_needed: 'মেয়াদোত্তীর্ণের তারিখ প্রয়োজন',
    status_expired: 'মেয়াদোত্তীর্ণ',
    status_not_provided: 'প্রদান করা হয়নি',
    status_ok: 'ঠিক আছে',
    generate_package: 'প্যাকেজ তৈরি করুন',
  }
};

export const t = (key: keyof typeof translations.en, language: Language): string => {
  return translations[language][key] || translations.en[key];
};
