import {utf8ByteLength} from '../domain/lab';
import {DESKTOP_COMMANDS, DESKTOP_FILE_LIMIT, DESKTOP_BACKUP_LIMIT, type DesktopRuntime} from './desktop-contract';

export interface LabFileAdapter {
  save(content: string, extension: 'json' | 'md'): Promise<boolean>;
  read(): Promise<string | null>;
}

export function createDesktopLabFiles(runtime: DesktopRuntime,kind:'lab'|'backup'='lab'): LabFileAdapter {
  const limit=kind==='backup'?DESKTOP_BACKUP_LIMIT:DESKTOP_FILE_LIMIT;
  return {
    save: async (content, extension) => {
      if(utf8ByteLength(content)>limit)throw new Error('file-too-large');
      return runtime.invoke<boolean>(DESKTOP_COMMANDS.export, {content, extension,...(kind==='backup'?{kind}: {})});
    },
    async read(): Promise<string | null> {
      const content = await runtime.invoke<string | null>(DESKTOP_COMMANDS.import,kind==='backup'?{kind}:undefined);
      if (content !== null && utf8ByteLength(content) > limit) {
        throw new Error('file-too-large');
      }
      return content;
    },
  };
}
