/** Narrow desktop bridge. The native host owns paths and opens system dialogs. */
export const DESKTOP_COMMANDS = {
  read: 'read_local_entry',
  write: 'write_local_entry',
  remove: 'remove_local_entry',
  export: 'export_lab_file',
  import: 'import_lab_file',
} as const;

export interface LocalKeyValueStorage {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem?(key: string): Promise<void>;
}

export interface DesktopRuntime {
  isDesktop(): boolean;
  invoke<T>(command: string, args?: Record<string, unknown>): Promise<T>;
}

export const DESKTOP_FILE_LIMIT = 5_000_000;
