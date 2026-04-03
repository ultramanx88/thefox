import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  ScrollView
} from 'react-native';
import { I18nManager, SUPPORTED_LOCALES, SupportedLocale } from '@repo/ui/i18n';
import { DesignTokens } from '@repo/ui/design-tokens';

interface MobileLanguageSwitcherProps {
  onLanguageChange?: (locale: SupportedLocale) => void;
}

export const MobileLanguageSwitcher: React.FC<MobileLanguageSwitcherProps> = ({ 
  onLanguageChange 
}) => {
  const [currentLocale, setCurrentLocale] = useState<SupportedLocale>('th');
  const [isModalVisible, setIsModalVisible] = useState(false);

  useEffect(() => {
    I18nManager.init();
    setCurrentLocale(I18nManager.getCurrentLocale());
  }, []);

  const handleLanguageChange = (locale: SupportedLocale) => {
    I18nManager.setLocale(locale);
    setCurrentLocale(locale);
    setIsModalVisible(false);
    onLanguageChange?.(locale);
  };

  const currentLanguage = SUPPORTED_LOCALES.find(l => l.code === currentLocale);

  return (
    <>
      <TouchableOpacity
        style={styles.trigger}
        onPress={() => setIsModalVisible(true)}
      >
        <Text style={styles.flag}>{currentLanguage?.flag}</Text>
        <Text style={styles.languageName}>{currentLanguage?.nativeName}</Text>
        <Text style={styles.arrow}>▼</Text>
      </TouchableOpacity>

      <Modal
        visible={isModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setIsModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>เลือกภาษา / Select Language</Text>
              <TouchableOpacity
                onPress={() => setIsModalVisible(false)}
                style={styles.closeButton}
              >
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.languageList}>
              {SUPPORTED_LOCALES.map((locale) => (
                <TouchableOpacity
                  key={locale.code}
                  style={[
                    styles.languageItem,
                    currentLocale === locale.code && styles.selectedLanguageItem
                  ]}
                  onPress={() => handleLanguageChange(locale.code)}
                >
                  <Text style={styles.languageFlag}>{locale.flag}</Text>
                  <View style={styles.languageInfo}>
                    <Text style={[
                      styles.languageNativeName,
                      currentLocale === locale.code && styles.selectedText
                    ]}>
                      {locale.nativeName}
                    </Text>
                    <Text style={[
                      styles.languageEnglishName,
                      currentLocale === locale.code && styles.selectedSubText
                    ]}>
                      {locale.name}
                    </Text>
                  </View>
                  {currentLocale === locale.code && (
                    <Text style={styles.checkmark}>✓</Text>
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>

            <View style={styles.deviceInfo}>
              <Text style={styles.deviceInfoText}>
                🌍 ตรวจพบภาษาอุปกรณ์: {currentLanguage?.nativeName}
              </Text>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
};

// Mobile translation hook
export const useMobileTranslation = () => {
  const [locale, setLocale] = useState<SupportedLocale>('th');

  useEffect(() => {
    I18nManager.init();
    setLocale(I18nManager.getCurrentLocale());
  }, []);

  const t = (key: string, params?: Record<string, string | number>) => {
    return I18nManager.t(key, params);
  };

  const formatCurrency = (amount: number) => {
    return I18nManager.formatCurrency(amount);
  };

  const formatDate = (date: Date) => {
    return I18nManager.formatDate(date);
  };

  return {
    t,
    locale,
    formatCurrency,
    formatDate,
    setLocale: (newLocale: SupportedLocale) => {
      I18nManager.setLocale(newLocale);
      setLocale(newLocale);
    }
  };
};

const styles = StyleSheet.create({
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: DesignTokens.spacing.md,
    paddingVertical: DesignTokens.spacing.sm,
    backgroundColor: '#ffffff',
    borderRadius: DesignTokens.borderRadius.md,
    borderWidth: 1,
    borderColor: DesignTokens.colors.gray[200],
    ...DesignTokens.shadows.sm,
  },
  flag: {
    fontSize: 20,
    marginRight: DesignTokens.spacing.sm,
  },
  languageName: {
    fontSize: DesignTokens.typography.sizes.base,
    fontWeight: DesignTokens.typography.weights.medium,
    color: DesignTokens.colors.gray[700],
    flex: 1,
  },
  arrow: {
    fontSize: DesignTokens.typography.sizes.sm,
    color: DesignTokens.colors.gray[500],
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: DesignTokens.borderRadius.xl,
    borderTopRightRadius: DesignTokens.borderRadius.xl,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: DesignTokens.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: DesignTokens.colors.gray[200],
  },
  modalTitle: {
    fontSize: DesignTokens.typography.sizes.lg,
    fontWeight: DesignTokens.typography.weights.semibold,
    color: DesignTokens.colors.gray[900],
  },
  closeButton: {
    padding: DesignTokens.spacing.sm,
  },
  closeButtonText: {
    fontSize: DesignTokens.typography.sizes.lg,
    color: DesignTokens.colors.gray[500],
  },
  languageList: {
    maxHeight: 400,
  },
  languageItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: DesignTokens.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: DesignTokens.colors.gray[100],
  },
  selectedLanguageItem: {
    backgroundColor: DesignTokens.colors.primary[50],
  },
  languageFlag: {
    fontSize: 24,
    marginRight: DesignTokens.spacing.md,
  },
  languageInfo: {
    flex: 1,
  },
  languageNativeName: {
    fontSize: DesignTokens.typography.sizes.base,
    fontWeight: DesignTokens.typography.weights.medium,
    color: DesignTokens.colors.gray[900],
    marginBottom: 2,
  },
  languageEnglishName: {
    fontSize: DesignTokens.typography.sizes.sm,
    color: DesignTokens.colors.gray[600],
  },
  selectedText: {
    color: DesignTokens.colors.primary[700],
  },
  selectedSubText: {
    color: DesignTokens.colors.primary[600],
  },
  checkmark: {
    fontSize: DesignTokens.typography.sizes.lg,
    color: DesignTokens.colors.primary[600],
    fontWeight: DesignTokens.typography.weights.bold,
  },
  deviceInfo: {
    padding: DesignTokens.spacing.lg,
    backgroundColor: DesignTokens.colors.gray[50],
    borderTopWidth: 1,
    borderTopColor: DesignTokens.colors.gray[200],
  },
  deviceInfoText: {
    fontSize: DesignTokens.typography.sizes.sm,
    color: DesignTokens.colors.gray[600],
    textAlign: 'center',
  },
});