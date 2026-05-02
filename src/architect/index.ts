import path from 'path';
import type { AnalyzedFile, ActionPlan, Action, TemplateEntry } from '../types.js';
import { TEMPLATE } from './template.js';

export { TEMPLATE };

export function buildPlan(files: AnalyzedFile[], cwd: string): ActionPlan {
  const plan: ActionPlan = [];
  const dirsToCreate = new Set<string>();
  const barrelsToCreate = new Map<string, string>(); // dir → barrel path

  for (const file of files) {
    const dest = resolveDestination(file);
    if (!dest) continue; // app.component, unknown — não mover

    const destDir = path.posix.join('src', 'app', dest.dir);
    const destPath = path.posix.join(destDir, file.filename);

    // normaliza barras do relativePath atual
    const currentPath = file.relativePath.replace(/\\/g, '/');

    if (currentPath === destPath) {
      // já está no lugar certo
      plan.push({ type: 'skip', to: destPath });
    } else {
      dirsToCreate.add(destDir);
      plan.push({ type: 'move', from: currentPath, to: destPath });
    }

    // registra barrel para a pasta de destino se for necessário
    if (dest.needsBarrel) {
      const barrelPath = path.posix.join(destDir, 'index.ts');
      if (!barrelsToCreate.has(destDir)) {
        barrelsToCreate.set(destDir, barrelPath);
      }
    }
  }

  // adiciona criação de pastas da estrutura base que ainda não existem
  for (const entry of TEMPLATE) {
    dirsToCreate.add(entry.path);
    if (entry.needsBarrel) {
      const barrelPath = `${entry.path}/index.ts`;
      if (!barrelsToCreate.has(entry.path)) {
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
    content: barrelComment(b),
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

function barrelComment(barrelPath: string): string {
  const dir = path.posix.dirname(barrelPath);
  return [
    '// barrel — re-exporte os arquivos desta pasta aqui',
    '// exemplo:',
    `//   export * from './<nome-do-arquivo>';`,
    `// pasta: ${dir}`,
    '',
  ].join('\n');
}

export function getMissingEntries(
  existingPaths: Set<string>,
  template: TemplateEntry[] = TEMPLATE
): TemplateEntry[] {
  return template.filter((e) => !existingPaths.has(e.path));
}
