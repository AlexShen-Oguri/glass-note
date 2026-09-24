export type BackupErrorCode = 'invalid-json'|'invalid-format'|'unsupported-version'|'invalid-data'|'unsafe-key';

export class BackupError extends Error {
  constructor(public readonly code: BackupErrorCode, message: string) {
    super(message);
    this.name = 'BackupError';
  }
}
