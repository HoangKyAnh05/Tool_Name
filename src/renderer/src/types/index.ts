export interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  size?: number | string;
  modifiedTime?: string;
  thumbnailLink?: string;
  webViewLink?: string;
  duration?: string;
  // AI fields
  proposedName?: string;
  summary?: string;
  status: 'idle' | 'analyzing' | 'ready' | 'renaming' | 'renamed' | 'error';
  errorMsg?: string;
  selected?: boolean;
}

export interface DriveFolder {
  id: string;
  name: string;
}

export interface RenameConfig {
  namingPattern: 'standard' | 'detailed' | 'date_topic' | 'custom';
  customTemplate: string;
  language: 'vi' | 'en' | 'vi_no_accent';
  caseStyle: 'Readable Space' | 'snake_case' | 'kebab-case' | 'CamelCase' | 'lowercase';
  includeDate: boolean;
  includeIndex: boolean;
  indexFormat: '1.' | '01.' | '1 -' | '[1]';
  prefix: string;
  maxWords: number;
  contextHint: string;
}

export interface ApiConfig {
  googleClientId: string;
  googleClientSecret: string;
  geminiApiKey: string;
  geminiModel: string;
  isDemoMode: boolean;
}

export interface LogEntry {
  id: string;
  timestamp: string;
  type: 'info' | 'success' | 'warning' | 'error';
  message: string;
}

export interface ScanProgress {
  current: number;
  total: number;
  currentFileName: string;
}
