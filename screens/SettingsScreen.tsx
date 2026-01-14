import React from "react";
import { View, StyleSheet, Pressable, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";

import { ThemedText } from "@/components/ThemedText";
import { Card } from "@/components/Card";
import { Colors, Spacing, BorderRadius } from "@/constants/theme";
import { useLanguage, languageNames, type Language } from "@/i18n";

type SettingsScreenProps = {
  visible: boolean;
  onClose: () => void;
};

const LANGUAGES: Language[] = ['cs', 'en', 'de', 'fr', 'es', 'it', 'pl', 'nl', 'pt', 'sv', 'no', 'da', 'fi', 'hu', 'ro'];

export function SettingsScreen({ visible, onClose }: SettingsScreenProps) {
  const insets = useSafeAreaInsets();
  const { language, setLanguage, t } = useLanguage();

  if (!visible) return null;

  const handleLanguageSelect = async (lang: Language) => {
    await setLanguage(lang);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top + Spacing.lg }]}>
      <View style={styles.header}>
        <ThemedText type="h3">{t('settings')}</ThemedText>
        <Pressable onPress={onClose} style={styles.closeButton}>
          <Feather name="x" size={24} color={Colors.dark.text} />
        </Pressable>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <ThemedText type="small" color="secondary" style={styles.sectionLabel}>
            {t('language')}
          </ThemedText>
          <Card elevation={1} style={styles.card}>
            {LANGUAGES.map((lang, index) => (
              <Pressable
                key={lang}
                onPress={() => handleLanguageSelect(lang)}
                style={({ pressed }) => [
                  styles.languageItem,
                  index < LANGUAGES.length - 1 && styles.languageItemBorder,
                  { opacity: pressed ? 0.7 : 1 },
                ]}
              >
                <ThemedText type="body">{languageNames[lang]}</ThemedText>
                {language === lang ? (
                  <Feather name="check" size={20} color={Colors.dark.primary} />
                ) : null}
              </Pressable>
            ))}
          </Card>
        </View>

        <View style={styles.section}>
          <ThemedText type="small" color="secondary" style={styles.sectionLabel}>
            {t('privacyNotice')}
          </ThemedText>
          <Card elevation={1} style={styles.card}>
            <View style={styles.privacyContent}>
              <Feather name="shield" size={32} color={Colors.dark.success} style={styles.privacyIcon} />
              <ThemedText type="body" style={styles.privacyText}>
                {t('privacyText')}
              </ThemedText>
            </View>
          </Card>
        </View>

        <View style={styles.section}>
          <ThemedText type="small" color="secondary" style={styles.sectionLabel}>
            {t('version')}
          </ThemedText>
          <Card elevation={1} style={styles.card}>
            <ThemedText type="body" color="secondary">1.0.0</ThemedText>
          </Card>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: Colors.dark.backgroundRoot,
    zIndex: 999,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.dark.border,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.dark.backgroundSecondary,
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.xl,
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionLabel: {
    marginBottom: Spacing.sm,
    marginLeft: Spacing.xs,
  },
  card: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
  },
  languageItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: Spacing.md,
  },
  languageItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.dark.border,
  },
  privacyContent: {
    paddingVertical: Spacing.md,
  },
  privacyIcon: {
    alignSelf: "center",
    marginBottom: Spacing.md,
  },
  privacyText: {
    textAlign: "center",
    lineHeight: 22,
  },
});
