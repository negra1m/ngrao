import path from 'path';
import type { AnalyzedFile, ActionPlan, Action, TemplateEntry, LayoutMode } from '../types.js';
import { TEMPLATE } from './template.js';
import { scanExistingStructure } from '../detector/index.js';
import { barrelPlaceholder } from '../utils/barrel.js';
import { readFeatureDirs } from '../utils/features.js';
import { collectFeatureNames, resolveFeatureFirstDestination } from './feature-first.js';

export { TEMPLATE };
export * from './feature-first.js';

export function buildPlan(
  files: AnalyzedFile[],
  cwd: string,
  mode: LayoutMode = 'classic'
): ActionPlan {
  const plan: ActionPlan = [];
  const dirsToCreate = new Set<string>();
  const barrelsToCreate = new Map<string, string>(); // dir → barrel path

  // paths já existentes no disco — evita ações fantasma em projeto conforme
  const existing = new Set(scanExistingStructure(cwd).map((e) => e.path));

  const featureFirst = mode === 'feature-first';
  const features = featureFirst
    ? collectFeatureNames(files, readFeatureDirs(path.join(cwd, 'src', 'app')))
    : new Set<string>();

  for (const file of files) {
    const dest = featureFirst
      ? resolveFeatureFirstDestination(file, features)
      : resolveDestination(file);
    if (!dest) continue; // app.component, unknown — não mover

    const destDir = path.posix.join('src', 'app', dest.dir);
    const destPath = path.posix.join(destDir, file.filename);

    // normaliza barras do relativePath atual
    const currentPath = file.relativePath.replace(/\\/g, '/');

    if (currentPath === destPath) {
      // já está no lugar certo
      plan.push({ type: 'skip', to: destPath });
    } else {
      if (!existing.has(destDir)) dirsToCreate.add(destDir);
      plan.push({ type: 'move', from: currentPath, to: destPath });
    }

    // registra barrel para a pasta de destino se for necessário e ainda não existir
    if (dest.needsBarrel) {
      const barrelPath = path.posix.join(destDir, 'index.ts');
      if (!existing.has(barrelPath) && !barrelsToCreate.has(destDir)) {
        barrelsToCreate.set(destDir, barrelPath);
      }
    }
  }

  // estrutura base e barrels são exclusivos do modo clássico —
  // feature-first só cria as pastas que os moves exigem
  if (!featureFirst) {
    // adiciona criação de pastas da estrutura base que ainda não existem
    for (const entry of getMissingEntries(existing)) {
      dirsToCreate.add(entry.path);
    }
    for (const entry of TEMPLATE) {
      if (!entry.needsBarrel) continue;
      const barrelPath = `${entry.path}/index.ts`;
      if (!existing.has(barrelPath) && !barrelsToCreate.has(entry.path)) {
        barrelsToCreate.set(entry.path, barrelPath);
      }
    }
  }

  // insere create_dir no início do plano (antes dos moves)
  const dirActions: Action[] = [...dirsToCreate].sort().map((d) => ({
    type: 'create_dir',
    to: d,
  }));

  const barrelActions: Action[] = [...barrelsToCreate.values()].sort().map((b) => ({
    type: 'create_barrel',
    to: b,
    content: barrelPlaceholder(path.posix.dirname(b)),
  }));

  return [...dirActions, ...plan, ...barrelActions];
}

// Resolve para qual subpasta dentro de src/app/ o arquivo deve ir
function resolveDestination(
  file: AnalyzedFile
): { dir: string; needsBarrel: boolean } | null {
  const { kind, scope, domain, role, filename, relativePath } = file;

  // arquivos já dentro de sub-components/ ficam onde estão
  if (relativePath.includes('sub-components/')) return null;

  // app.component.ts — fica na raiz de src/app/
  if (filename === 'app.component.ts') return null;

  // outros arquivos na raiz que não seguem padrão — ignorar
  if (kind === 'other') return null;

  switch (kind) {
    case 'guard':
      return { dir: 'core/guards', needsBarrel: true };

    case 'interceptor':
      return { dir: 'core/interceptors', needsBarrel: true };

    case 'pipe':
      // ex: operator.pipe.ts → shared/pipes/operator/
      return { dir: `shared/pipes/${stripSuffix(filename, '.pipe.ts')}`, needsBarrel: true };

    case 'normalizer':
      // ex: datagrid-content.normalizer.ts → shared/normalizers/datagrid/
      return { dir: `shared/normalizers/${domain}`, needsBarrel: false };

    case 'model':
      if (scope === 'shared') {
        // models dentro de shared/components ficam junto com o component
        return null; // já está no lugar certo (shared/components/[x]/models/)
      }
      return { dir: `core/models/${domain}`, needsBarrel: false };

    case 'mock':
      if (scope === 'shared') return null;
      return { dir: `core/mocks/${domain}`, needsBarrel: false };

    case 'service':
      if (scope === 'core') {
        return { dir: `core/services/${domain}`, needsBarrel: true };
      }
      if (scope === 'shared') return null; // shared/components/[x]/services/ — já está
      // feature — precisa saber a feature. Usa o domain como feature name
      return { dir: `modules/${domain}/services`, needsBarrel: true };

    case 'component':
      if (scope === 'shared') return null; // já está em shared/
      // feature component ou page
      if (role === 'page') {
        const compName = stripSuffix(filename, '.component.ts');
        return { dir: `modules/${domain}/pages/${compName}`, needsBarrel: false };
      } else {
        const compName = stripSuffix(filename, '.component.ts');
        return { dir: `modules/${domain}/components/${compName}`, needsBarrel: false };
      }

    default:
      return null;
  }
}

function stripSuffix(filename: string, suffix: string): string {
  return filename.endsWith(suffix) ? filename.slice(0, -suffix.length) : filename;
}

export function getMissingEntries(
  existingPaths: Set<string>,
  template: TemplateEntry[] = TEMPLATE
): TemplateEntry[] {
  return template.filter((e) => !existingPaths.has(e.path));
}
