import {utf8ByteLength} from '../domain/lab';
import {DESKTOP_COMMANDS, DESKTOP_FILE_LIMIT, type DesktopRuntime} from './desktop-contract';

export interface LabFileAdapter {
  save(content: string, extension: 'json' | 'md'): Promise<boolean>;
  read(): Promise<string | null>;
}

export function createDesktopLabFiles(runtime: DesktopRuntime): LabFileAdapter {
  return {
    save: (content, extension) => runtime.invoke<boolean>(DESKTOP_COMMANDS.export, {content, extension}),
    async read(): Promise<string | null> {
      const content = await runtime.invoke<string | null>(DESKTOP_COMMANDS.import);
      if (content !== null && utf8ByteLength(content) > DESKTOP_FILE_LIMIT) {
        throw new Error('file-too-large');
      }
      return content;
    },
  };
}
