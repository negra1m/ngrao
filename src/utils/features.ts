import fs from 'fs';
import path from 'path';

// Pastas globais por tipo na raiz de src/app no modo feature-first.
// Tudo que não pertence a nenhuma feature mora numa delas.
export const GLOBAL_DIRS = [
  'components',
  'guards',
  'interceptors',
  'mocks',
  'models',
  'normalizers',
  'pipes',
  'services',
] as const;

// Pastas na raiz de src/app que nunca contam como feature:
// as globais + as legadas do modo clássico.
const RESERVED_ROOT_DIRS = new Set<string>([...GLOBAL_DIRS, 'core', 'shared', 'modules']);

export function isReservedRootDir(name: string): boolean {
  return RESERVED_ROOT_DIRS.has(name);
}

// Features já materializadas no disco: pastas não reservadas na raiz de src/app
// (feature-first) + pastas de src/app/modules (estrutura clássica sendo migrada).
export function readFeatureDirs(appRoot: string): Set<string> {
  const names = new Set<string>();
  for (const dir of listDirs(appRoot)) {
    if (!isReservedRootDir(dir)) names.add(dir);
  }
  for (const dir of listDirs(path.join(appRoot, 'modules'))) {
    names.add(dir);
  }
  return names;
}

function listDirs(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir, { withFileTypes: true })
    .filter((e) => e.isDirectory())
    .map((e) => e.name);
}
