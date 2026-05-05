import fs from 'fs';
import path from 'path';
import type { AnalyzedFile, FileKind, FileScope, ComponentRole } from '../types.js';

// Coleta todos os .ts relevantes em src/app (exceto spec, module, routing, playground)
export function collectFiles(cwd: string): AnalyzedFile[] {
  const appRoot = path.join(cwd, 'src', 'app');
  if (!fs.existsSync(appRoot)) return [];

  const tsFiles = walkTs(appRoot);
  const routedComponents = collectRoutedComponents(appRoot);
  const aliasRoots = readAliasRoots(cwd);

  return tsFiles.map((abs) => analyze(abs, cwd, appRoot, routedComponents, aliasRoots));
}

// Lê tsconfig*.json e extrai as raízes dos path aliases (ex: @core/* → src/app/core)
function readAliasRoots(cwd: string): string[] {
  const candidates = ['tsconfig.json', 'tsconfig.app.json', 'tsconfig.base.json'];
  const roots = new Set<string>();

  for (const candidate of candidates) {
    const tsconfigPath = path.join(cwd, candidate);
    if (!fs.existsSync(tsconfigPath)) continue;
    try {
      const raw = fs.readFileSync(tsconfigPath, 'utf-8');
      // strip JSONC: remove apenas linhas que são inteiramente comentários
      // (não toca em strings JSON que contenham /* ou // como glob patterns)
      const stripped = raw
        .split('\n')
        .filter((line) => !/^\s*(\/\/|\/\*)/.test(line))
        .join('\n');
      const tsconfig = JSON.parse(stripped);
      const paths: Record<string, string[]> = tsconfig?.compilerOptions?.paths ?? {};
      for (const targets of Object.values(paths)) {
        for (const target of targets) {
          const root = target.replace(/\/\*$/, '').replace(/\\/g, '/');
          if (root) roots.add(root);
        }
      }
    } catch {
      // ignora tsconfig malformado
    }
  }

  return [...roots];
}

function walkTs(dir: string): string[] {
  const results: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...walkTs(full));
    } else if (
      entry.name.endsWith('.ts') &&
      !entry.name.startsWith('._') &&        // ignorar arquivos fantasma do macOS
      !entry.name.endsWith('.spec.ts') &&
      !entry.name.endsWith('.module.ts') &&
      !entry.name.endsWith('-routing.module.ts') &&
      !entry.name.endsWith('.sandbox.ts') &&
      entry.name !== 'index.ts'
    ) {
      results.push(full);
    }
  }
  return results;
}

// Lê todos os *-routing.module.ts e coleta os seletores de component que aparecem em `component:` dentro de Routes
function collectRoutedComponents(appRoot: string): Set<string> {
  const routed = new Set<string>();
  const routingFiles = walkRoutingFiles(appRoot);

  for (const rf of routingFiles) {
    const content = fs.readFileSync(rf, 'utf-8');
    // captura "component: FooBarComponent" em qualquer linha
    const matches = content.matchAll(/component:\s*(\w+Component)/g);
    for (const m of matches) {
      routed.add(m[1]);
    }
  }
  return routed;
}

function walkRoutingFiles(dir: string): string[] {
  const results: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) results.push(...walkRoutingFiles(full));
    else if (entry.name.endsWith('-routing.module.ts')) results.push(full);
  }
  return results;
}

function analyze(
  abs: string,
  cwd: string,
  appRoot: string,
  routedComponents: Set<string>,
  aliasRoots: string[]
): AnalyzedFile {
  const filename = path.basename(abs);
  const relativePath = path.relative(cwd, abs).replace(/\\/g, '/');

  // se o arquivo está dentro de uma raiz coberta por alias, não mover
  const coveredByAlias = aliasRoots.some((root) => relativePath.startsWith(root + '/'));
  const kind = coveredByAlias ? 'other' : detectKind(filename);

  const content = fs.readFileSync(abs, 'utf-8');
  const scope = detectScope(kind, content, relativePath);
  const domain = detectDomain(filename, kind, relativePath);
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

function detectScope(kind: FileKind, content: string, relativePath: string): FileScope {
  // guards e interceptors são sempre core
  if (kind === 'guard' || kind === 'interceptor') return 'core';

  // pipes e normalizers são sempre shared
  if (kind === 'pipe' || kind === 'normalizer') return 'shared';

  // services: providedIn root = core, caso contrário = feature
  if (kind === 'service') {
    if (/providedIn\s*:\s*['"]root['"]/.test(content)) return 'core';
    // service dentro de shared/components = shared
    if (relativePath.includes('shared/')) return 'shared';
    return 'feature';
  }

  // models e mocks: se já estão em shared/ = shared, senão = core (globais)
  if (kind === 'model' || kind === 'mock') {
    if (relativePath.includes('shared/')) return 'shared';
    return 'core';
  }

  // components: app.component = skip, shared/ = shared, modules/ = feature
  if (kind === 'component') {
    if (relativePath.includes('shared/')) return 'shared';
    return 'feature';
  }

  return 'unknown';
}

// Extrai o domínio do arquivo.
// Prioridade: path estruturado (modules/[feature]/) > nome do arquivo.
function detectDomain(filename: string, kind: FileKind, relativePath: string): string {
  // se já está dentro de modules/[feature]/, usa o nome da feature como domain
  const modulesMatch = relativePath.match(/src\/app\/modules\/([^/]+)\//);
  if (modulesMatch) return modulesMatch[1];

  // se já está dentro de core/[tipo]/[domain]/, usa o domain do path
  const coreMatch = relativePath.match(/src\/app\/core\/(?:services|models|mocks|guards|interceptors)\/([^/]+)\//);
  if (coreMatch) return coreMatch[1];

  // fallback: primeiro segmento do nome do arquivo
  // ex: alarms-creation.service.ts → alarms
  // ex: performance-status.service.ts → performance
  const suffix = kindSuffix(kind);
  const base = filename.replace(suffix, '');
  const parts = base.split('-');
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
