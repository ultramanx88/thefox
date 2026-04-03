import { Platform } from 'react-native';

export type SupportedLocale = 'th' | 'en' | 'zh' | 'ja' | 'ko';

export interface LocaleConfig {
  code: SupportedLocale;
  name: string;
  nativeName: string;
  flag: string;
  rtl: boolean;
}

export const SUPPORTED_LOCALES: LocaleConfig[] = [
  { code: 'th', name: 'Thai', nativeName: 'ไทย', flag: '🇹🇭', rtl: false },
  { code: 'en', name: 'English', nativeName: 'English', flag: '🇺🇸', rtl: false },
  { code: 'zh', name: 'Chinese', nativeName: '中文', flag: '🇨🇳', rtl: false },
  { code: 'ja', name: 'Japanese', nativeName: '日本語', flag: '🇯🇵', rtl: false },
  { code: 'ko', name: 'Korean', nativeName: '한국어', flag: '🇰🇷', rtl: false }
];

export class LocaleDetector {
  static getDeviceLocale(): SupportedLocale {
    let deviceLocale = 'en';
    
    if (Platform.OS === 'web') {
      // Web browser locale detection
      deviceLocale = navigator.language || navigator.languages?.[0] || 'en';
    } else {
      // React Native locale detection
      const RNLocalize = require('react-native-localize');
      const locales = RNLocalize.getLocales();
      deviceLocale = locales[0]?.languageCode || 'en';
    }
    
    // Extract language code (e.g., 'th-TH' -> 'th')
    const langCode = deviceLocale.split('-')[0].toLowerCase();
    
    // Check if supported, fallback to Thai for Thailand region
    const supported = SUPPORTED_LOCALES.find(l => l.code === langCode);
    return supported ? langCode as SupportedLocale : 'th';
  }
  
  static getTimeZone(): string {
    if (Platform.OS === 'web') {
      return Intl.DateTimeFormat().resolvedOptions().timeZone;
    } else {
      const RNLocalize = require('react-native-localize');
      return RNLocalize.getTimeZone();
    }
  }
  
  static getCurrency(): string {
    const locale = this.getDeviceLocale();
    const currencyMap: Record<SupportedLocale, string> = {
      th: 'THB',
      en: 'USD', 
      zh: 'CNY',
      ja: 'JPY',
      ko: 'KRW'
    };
    return currencyMap[locale] || 'THB';
  }
  
  static getNumberFormat(): Intl.NumberFormatOptions {
    const locale = this.getDeviceLocale();
    return {
      style: 'currency',
      currency: this.getCurrency(),
      minimumFractionDigits: locale === 'ja' || locale === 'ko' ? 0 : 2
    };
  }
}

export class I18nManager {
  private static currentLocale: SupportedLocale = 'th';
  private static translations: Record<SupportedLocale, Record<string, string>> = {
    th: {},
    en: {},
    zh: {},
    ja: {},
    ko: {}
  };
  
  static init() {
    this.currentLocale = LocaleDetector.getDeviceLocale();
    this.loadTranslations();
  }
  
  static setLocale(locale: SupportedLocale) {
    this.currentLocale = locale;
    if (Platform.OS === 'web') {
      localStorage.setItem('locale', locale);
    }
  }
  
  static getCurrentLocale(): SupportedLocale {
    return this.currentLocale;
  }
  
  static t(key: string, params?: Record<string, string | number>): string {
    let text = this.translations[this.currentLocale]?.[key] || key;
    
    if (params) {
      Object.entries(params).forEach(([param, value]) => {
        text = text.replace(`{{${param}}}`, String(value));
      });
    }
    
    return text;
  }
  
  static formatCurrency(amount: number): string {
    const locale = this.currentLocale === 'th' ? 'th-TH' : 
                   this.currentLocale === 'zh' ? 'zh-CN' :
                   this.currentLocale === 'ja' ? 'ja-JP' :
                   this.currentLocale === 'ko' ? 'ko-KR' : 'en-US';
    
    return new Intl.NumberFormat(locale, LocaleDetector.getNumberFormat()).format(amount);
  }
  
  static formatDate(date: Date): string {
    const locale = this.currentLocale === 'th' ? 'th-TH' : 
                   this.currentLocale === 'zh' ? 'zh-CN' :
                   this.currentLocale === 'ja' ? 'ja-JP' :
                   this.currentLocale === 'ko' ? 'ko-KR' : 'en-US';
    
    return new Intl.DateTimeFormat(locale, {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(date);
  }
  
  private static loadTranslations() {
    // Load translations based on platform
    if (Platform.OS === 'web') {
      this.loadWebTranslations();
    } else {
      this.loadMobileTranslations();
    }
  }
  
  private static loadWebTranslations() {
    // Web translations loading
    this.translations = {
      th: require('../../../apps/web/src/messages/th.json'),
      en: require('../../../apps/web/src/messages/en.json'),
      zh: require('../../../apps/web/src/messages/zh.json'),
      ja: require('../../../apps/web/src/messages/ja.json'),
      ko: require('../../../apps/web/src/messages/ko.json')
    };
  }
  
  private static loadMobileTranslations() {
    // Mobile translations loading
    this.translations = {
      th: require('../../../apps/mobile/src/locales/th.json'),
      en: require('../../../apps/mobile/src/locales/en.json'),
      zh: require('../../../apps/mobile/src/locales/zh.json'),
      ja: require('../../../apps/mobile/src/locales/ja.json'),
      ko: require('../../../apps/mobile/src/locales/ko.json')
    };
  }
}