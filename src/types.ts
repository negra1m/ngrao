export type FileKind =
  | 'component'
  | 'service'
  | 'guard'
  | 'interceptor'
  | 'model'
  | 'mock'
  | 'pipe'
  | 'normalizer'
  | 'other';

export type FileScope =
  | 'core'       // singleton global (providedIn: 'root', guards, interceptors, models globais, mocks globais)
  | 'feature'    // escopo de feature (module)
  | 'shared'     // reutilizável entre features
  | 'unknown';

export type ComponentRole = 'page' | 'component';

export interface AnalyzedFile {
  absolutePath: string;
  relativePath: string;   // relativo ao cwd
  filename: string;       // ex: login.service.ts
  kind: FileKind;
  scope: FileScope;
  domain: string;         // ex: 'login', 'alarms', 'performance'
  role?: ComponentRole;   // só para components
}

export type ActionType = 'move' | 'create_dir' | 'create_barrel' | 'skip';

export interface Action {
  type: ActionType;
  from?: string;          // caminho original (para move)
  to: string;             // destino relativo ao cwd
  content?: string;       // para create_barrel
}

export type ActionPlan = Action[];

export interface Report {
  moved: number;
  created: number;
  barrels: number;
  skipped: number;
}

export interface FileEntry {
  path: string;
  exists: boolean;
}

export type FileMap = FileEntry[];

export interface TemplateEntry {
  path: string;
  needsBarrel: boolean;
}
