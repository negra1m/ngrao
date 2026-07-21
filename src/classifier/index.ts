import fs from 'fs';
import path from 'path';
import type { AnalyzedFile, FileKind, FileScope, ComponentRole } from '../types.js';
import { readAliasRoots } from '../utils/tsconfig.js';
import { walkFiles } from '../utils/walk.js';

// Coleta todos os .ts relevantes em src/app (exceto spec, module, routing, routes, playground)
export function collectFiles(cwd: string): AnalyzedFile[] {
  const appRoot = path.join(cwd, 'src', 'app');
  if (!fs.existsSync(appRoot)) return [];

  const tsFiles = walkFiles(appRoot, isCollectible);
  const routedComponents = collectRoutedComponents(appRoot);
  const aliasRoots = readAliasRoots(cwd);
  const moduleNames = readModuleNames(appRoot);

  return tsFiles.map((abs) => analyze(abs, cwd, routedComponents, aliasRoots, moduleNames));
}

function isCollectible(name: string): boolean {
  return (
    name.endsWith('.ts') &&
    !name.startsWith('._') &&               // ignorar arquivos fantasma do macOS
    !name.endsWith('.spec.ts') &&
    !name.endsWith('.module.ts') &&
    !name.endsWith('-routing.module.ts') &&
    !name.endsWith('.routes.ts') &&
    !name.endsWith('.sandbox.ts') &&
    name !== 'index.ts'
  );
}

// Nomes das features já existentes em src/app/modules — usados no longest-match de domain
function readModuleNames(appRoot: string): Set<string> {
  const modulesDir = path.join(appRoot, 'modules');
  if (!fs.existsSync(modulesDir)) return new Set();
  return new Set(
    fs.readdirSync(modulesDir, { withFileTypes: true })
      .filter((e) => e.isDirectory())
      .map((e) => e.name)
  );
}

// Lê arquivos de rotas (NgModule e standalone) e coleta os components roteáveis:
//   component: FooComponent                                → eager (NgModule ou standalone)
//   loadComponent: () => import('...').then(m => m.FooComponent)  → lazy standalone
function collectRoutedComponents(appRoot: string): Set<string> {
  const routed = new Set<string>();
  const routeFiles = walkFiles(
    appRoot,
    (name) => name.endsWith('-routing.module.ts') || name.endsWith('.routes.ts')
  );

  for (const rf of routeFiles) {
    const content = fs.readFileSync(rf, 'utf-8');
    for (const m of content.matchAll(/component:\s*(\w+Component)/g)) {
      routed.add(m[1]);
    }
    for (const m of content.matchAll(/\.then\(\s*\(?\s*\w+\s*\)?\s*=>\s*\w+\.(\w+Component)\s*\)/g)) {
      routed.add(m[1]);
    }
  }
  return routed;
}

function analyze(
  abs: string,
  cwd: string,
  routedComponents: Set<string>,
  aliasRoots: string[],
  moduleNames: Set<string>
): AnalyzedFile {
  const filename = path.basename(abs);
  const relativePath = path.relative(cwd, abs).replace(/\\/g, '/');

  // se o arquivo está dentro de uma raiz coberta por alias, não mover
  const coveredByAlias = aliasRoots.some((root) => relativePath.startsWith(root + '/'));
  const kind = coveredByAlias ? 'other' : detectKind(filename);

  const content = fs.readFileSync(abs, 'utf-8');
  const scope = detectScope(kind, content, relativePath);
  const domain = detectDomain(filename, kind, relativePath, moduleNames);
  const role = kind === 'component' ? detectRole(content, routedComponents) : undefined;

  return { absolutePath: abs, relativePath, filename, kind, scope, domain, role };
}

function detectKind(filename: string): FileKind {
  if (filename.endsWith('.component.ts')) return 'component';
  if (filename.endsWith('.service.ts')) return 'service';
  if (filename.endsWith('.guard.ts')) return 'guard';
  if (filename.endsWith('.interceptor.ts')) return 'interceptor';
  if (filename.endsWith('.model.ts')) return 'model';
  if (filename.endsWith('.mock.ts')) return 'mock';
  if (filename.endsWith('.pipe.ts')) return 'pipe';
  if (filename.endsWith('.normalizer.ts')) return 'normalizer';
  return 'other';
}

// Ancorado em src/app/shared/ — não casa modules/[x]/shared/
function isInShared(relativePath: string): boolean {
  return relativePath.startsWith('src/app/shared/');
}

function detectScope(kind: FileKind, content: string, relativePath: string): FileScope {
  // guards e interceptors são sempre core
  if (kind === 'guard' || kind === 'interceptor') return 'core';

  // pipes e normalizers são sempre shared
  if (kind === 'pipe' || kind === 'normalizer') return 'shared';

  // services: providedIn root = core, caso contrário = feature
  if (kind === 'service') {
    if (/providedIn\s*:\s*['"]root['"]/.test(content)) return 'core';
    // service dentro de shared/components = shared
    if (isInShared(relativePath)) return 'shared';
    return 'feature';
  }

  // models e mocks: se já estão em shared/ = shared, senão = core (globais)
  if (kind === 'model' || kind === 'mock') {
    if (isInShared(relativePath)) return 'shared';
    return 'core';
  }

  // components: app.component = skip, shared/ = shared, modules/ = feature
  if (kind === 'component') {
    if (isInShared(relativePath)) return 'shared';
    return 'feature';
  }

  return 'unknown';
}

// Extrai o domínio do arquivo.
// Prioridade: path estruturado (modules/[feature]/) > nome do arquivo.
function detectDomain(
  filename: string,
  kind: FileKind,
  relativePath: string,
  moduleNames: Set<string>
): string {
  // se já está dentro de modules/[feature]/, usa o nome da feature como domain
  const modulesMatch = relativePath.match(/src\/app\/modules\/([^/]+)\//);
  if (modulesMatch) return modulesMatch[1];

  // se já está dentro de core/[tipo]/[domain]/, usa o domain do path
  const coreMatch = relativePath.match(/src\/app\/core\/(?:services|models|mocks|guards|interceptors)\/([^/]+)\//);
  if (coreMatch) return coreMatch[1];

  // fallback: segmentos do nome do arquivo.
  // Prefere o prefixo mais longo que corresponda a um módulo já existente:
  //   user-profile.service.ts + modules/user-profile/ → user-profile
  //   alarms-creation.service.ts → alarms
  const suffix = kindSuffix(kind);
  const base = filename.replace(suffix, '');
  const parts = base.split('-');
  for (let i = parts.length; i > 1; i--) {
    const candidate = parts.slice(0, i).join('-');
    if (moduleNames.has(candidate)) return candidate;
  }
  return parts[0] ?? base;
}

function kindSuffix(kind: FileKind): string {
  const map: Record<FileKind, string> = {
    component: '.component.ts',
    service: '.service.ts',
    guard: '.guard.ts',
    interceptor: '.interceptor.ts',
    model: '.model.ts',
    mock: '.mock.ts',
    pipe: '.pipe.ts',
    normalizer: '.normalizer.ts',
    other: '.ts',
  };
  return map[kind];
}

// Detecta se um component é page (roteável) ou component (reutilizável de feature)
function detectRole(content: string, routedComponents: Set<string>): ComponentRole {
  // extrai o nome da classe: "export class FooBarComponent"
  const match = content.match(/export\s+class\s+(\w+Component)/);
  if (!match) return 'component';
  return routedComponents.has(match[1]) ? 'page' : 'component';
}
