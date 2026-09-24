import {LOCALES, type Locale, type UnitPreference} from '../domain/contracts';

export const PREFERENCES_STORAGE_KEY = 'glass-notes.preferences';

export interface Preferences {
  locale: Locale;
  unit: UnitPreference;
  motionPaused: boolean;
}

const DEFAULT_PREFERENCES: Preferences = {
  locale: 'en',
  unit: 'ml',
  motionPaused: false,
};

export function isSupportedLocale(value: unknown): value is Locale {
  return typeof value === 'string' && (LOCALES as readonly string[]).includes(value);
}

// Rendering may use safe defaults; permission to write back requires a valid stored value.
export function validateStoredPreferences(raw: string | null): void {
  if (raw === null) return;
  const value: unknown = JSON.parse(raw);
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw Error('invalid-preferences');
  const record = value as Record<string, unknown>;
  if (Object.keys(record).some(key => !['locale', 'unit', 'motionPaused'].includes(key)) ||
      ('locale' in record && !isSupportedLocale(record.locale)) ||
      ('unit' in record && record.unit !== 'ml' && record.unit !== 'oz') ||
      ('motionPaused' in record && typeof record.motionPaused !== 'boolean')) {
    throw Error('invalid-preferences');
  }
}

export function localeFromDeviceLanguages(
  languageTags: readonly (string | null | undefined)[],
): Locale {
  for (const languageTag of languageTags) {
    if (typeof languageTag !== 'string') continue;
    const language = languageTag.trim().toLowerCase().split(/[-_]/, 1)[0];
    if (isSupportedLocale(language)) return language;
  }

  return 'en';
}

export function parseStoredPreferences(raw: string | null): Partial<Preferences> {
  if (!raw) return {};

  try {
    const value: unknown = JSON.parse(raw);
    if (!value || typeof value !== 'object' || Array.isArray(value)) return {};

    const record = value as Record<string, unknown>;
    const parsed: Partial<Preferences> = {};
    if (isSupportedLocale(record.locale)) parsed.locale = record.locale;
    if (record.unit === 'ml' || record.unit === 'oz') parsed.unit = record.unit;
    if (typeof record.motionPaused === 'boolean') {
      parsed.motionPaused = record.motionPaused;
    }
    return parsed;
  } catch {
    return {};
  }
}

export function resolvePreferences(
  storedValue: string | null,
  deviceLanguageTags: readonly (string | null | undefined)[],
): Preferences {
  const stored = parseStoredPreferences(storedValue);
  return {
    locale: stored.locale ?? localeFromDeviceLanguages(deviceLanguageTags),
    unit: stored.unit ?? DEFAULT_PREFERENCES.unit,
    motionPaused: stored.motionPaused ?? DEFAULT_PREFERENCES.motionPaused,
  };
}

export function serializePreferences(preferences: Preferences): string {
  return JSON.stringify(preferences);
}
