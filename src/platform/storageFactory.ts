import {DESKTOP_COMMANDS, type DesktopRuntime, type LocalKeyValueStorage} from './desktop-contract';

/**
 * Selects the host-backed store for a desktop webview and preserves AsyncStorage
 * everywhere else. A missing desktop value may be copied once from the same
 * origin's legacy web storage; host errors are never treated as empty data.
 */
export function createPlatformStorage(
  runtime: DesktopRuntime,
  browserStorage: LocalKeyValueStorage,
  legacyStorage: LocalKeyValueStorage = browserStorage,
): LocalKeyValueStorage {
  if (!runtime.isDesktop()) return browserStorage;

  async function clearLegacy(key: string): Promise<void> {
    if (legacyStorage.removeItem) {
      await legacyStorage.removeItem(key);
      if (await legacyStorage.getItem(key) !== null) throw new Error('legacy-storage-readback-failed');
    } else if (await legacyStorage.getItem(key) !== null) {
      throw new Error('legacy-remove-unavailable');
    }
  }

  return {
    async getItem(key: string): Promise<string | null> {
      const stored = await runtime.invoke<string | null>(DESKTOP_COMMANDS.read, {key});
      if (stored !== null) return stored;

      const legacy = await legacyStorage.getItem(key);
      if (legacy === null) return null;

      // Migration is complete only after the exact legacy payload reaches the host.
      await runtime.invoke<void>(DESKTOP_COMMANDS.write, {key, value: legacy});
      if (await runtime.invoke<string | null>(DESKTOP_COMMANDS.read, {key}) !== legacy) throw new Error('migration-readback-failed');
      await clearLegacy(key);
      return legacy;
    },
    async setItem(key: string, value: string): Promise<void> {
      await runtime.invoke<void>(DESKTOP_COMMANDS.write, {key, value});
    },
    async removeItem(key: string): Promise<void> {
      // Remove the fallback first, including leftovers from older migrations.
      // A crash or host failure must not make a deleted key reappear later.
      await clearLegacy(key);
      await runtime.invoke<void>(DESKTOP_COMMANDS.remove, {key});
    },
  };
}
