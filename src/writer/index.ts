import fs from 'fs';
import path from 'path';
import type { ActionPlan, Report } from '../types.js';
import { logger } from '../logger/index.js';
import { readAliasPaths, readBaseUrl } from '../utils/tsconfig.js';
import { walkFiles } from '../utils/walk.js';
import { buildBarrelContent } from '../utils/barrel.js';

export function execute(plan: ActionPlan, cwd: string): Report {
  const report: Report = { moved: 0, created: 0, barrels: 0, skipped: 0 };

  // mapa de moves: caminho antigo → novo (para reescrever imports depois)
  const moveMap = new Map<string, string>();

  // se um move falhar no meio, os imports dos moves já aplicados ainda são
  // reescritos antes de propagar o erro — evita deixar o projeto meio-migrado
  let failure: unknown = null;

  try {
    for (const action of plan) {
      const toAbs = path.join(cwd, action.to);

      if (action.type === 'skip') {
        logger.skip(action.to);
        report.skipped++;
        continue;
      }

      if (action.type === 'create_dir') {
        if (!fs.existsSync(toAbs)) {
          fs.mkdirSync(toAbs, { recursive: true });
          logger.create(action.to);
          report.created++;
        }
        continue;
      }

      if (action.type === 'create_barrel') {
        if (!fs.existsSync(toAbs)) {
          fs.mkdirSync(path.dirname(toAbs), { recursive: true });
          fs.writeFileSync(toAbs, buildBarrelContent(path.dirname(toAbs), action.content), 'utf-8');
          logger.barrel(action.to);
          report.barrels++;
        } else {
          logger.skip(action.to);
          report.skipped++;
        }
        continue;
      }

      if (action.type === 'move' && action.from) {
        const fromAbs = path.join(cwd, action.from);

        if (!fs.existsSync(fromAbs)) {
          logger.skip(`${action.from} (não encontrado)`);
          report.skipped++;
          continue;
        }

        if (fs.existsSync(toAbs)) {
          logger.skip(`${action.to} (já existe no destino)`);
          report.skipped++;
          continue;
        }

        fs.mkdirSync(path.dirname(toAbs), { recursive: true });
        fs.renameSync(fromAbs, toAbs);
        logger.move(action.from, action.to);
        moveMap.set(action.from, action.to);
        report.moved++;

        // move arquivos associados: .html, .scss, .css, .spec.ts, etc.
        const fromDir = path.dirname(fromAbs);
        const toDir = path.dirname(toAbs);
        const baseName = path.basename(action.from, '.ts'); // ex: search-box.component
        const siblings = getSiblingFiles(fromDir, baseName);
        for (const sibling of siblings) {
          const siblingDest = path.join(toDir, path.basename(sibling));
          if (!fs.existsSync(siblingDest)) {
            fs.renameSync(sibling, siblingDest);
            // registra no moveMap para que rewriteImports atualize templateUrl/styleUrl corretamente
            const siblingFrom = path.relative(cwd, sibling).replace(/\\/g, '/');
            const siblingTo = path.relative(cwd, siblingDest).replace(/\\/g, '/');
            moveMap.set(siblingFrom, siblingTo);
          }
        }
      }
    }
  } catch (err) {
    failure = err;
    logger.error('falha durante a execução — reescrevendo imports dos moves já aplicados.');
  }

  if (moveMap.size > 0) {
    rewriteImports(cwd, moveMap);
  }

  if (failure) throw failure;

  return report;
}

type ImportStyle = 'relative' | 'srcAbs' | 'alias' | 'baseUrl';

// Reescreve imports em todos os .ts do projeto para refletir os moves.
// Preserva o estilo do import original: relativo continua relativo,
// alias continua alias, absoluto (src/ ou baseUrl) continua absoluto.
function rewriteImports(cwd: string, moveMap: Map<string, string>): void {
  const srcRoot = path.join(cwd, 'src');
  const allTs = walkFiles(srcRoot, (name) => name.endsWith('.ts'));

  // lê baseUrl e aliases do tsconfig para resolver imports absolutos
  const baseUrl = readBaseUrl(cwd);
  const aliasPaths = readAliasPaths(cwd);

  // mapa inverso: novo caminho → caminho original (para arquivos que foram movidos)
  const reverseMap = new Map<string, string>();
  for (const [from, to] of moveMap) {
    reverseMap.set(to, from);
  }

  const stripTs = (p: string): string => p.replace(/\.ts$/, '');

  for (const file of allTs) {
    let content = fs.readFileSync(file, 'utf-8');
    let changed = false;

    const fileRel = path.relative(cwd, file).replace(/\\/g, '/');
    // se este arquivo foi movido, resolver imports a partir da localização original
    const originalFileRel = reverseMap.get(fileRel);
    const effectiveFileDir = originalFileRel
      ? path.dirname(path.join(cwd, originalFileRel))
      : path.dirname(file);

    const rewritePath = (importPath: string): string | null => {
      let resolvedImport: string;
      let style: ImportStyle;
      let aliasPrefix = '';
      let aliasRoot = '';

      if (importPath.startsWith('.')) {
        style = 'relative';
        resolvedImport = path.resolve(effectiveFileDir, importPath);
      } else if (importPath.startsWith('src/')) {
        style = 'srcAbs';
        resolvedImport = path.join(cwd, importPath);
      } else {
        // import via path alias (ex: '@core/services/foo') — resolve usando mapa do tsconfig
        let aliasResolved: string | null = null;
        for (const [prefix, root] of aliasPaths) {
          if (importPath === prefix || importPath.startsWith(prefix + '/')) {
            const rest = importPath.slice(prefix.length).replace(/^\//, '');
            aliasResolved = path.join(cwd, root, rest);
            aliasPrefix = prefix;
            aliasRoot = root;
            break;
          }
        }
        if (aliasResolved) {
          style = 'alias';
          resolvedImport = aliasResolved;
        } else if (baseUrl && !importPath.startsWith('@')) {
          // import absoluto com baseUrl customizado (ex: 'app/services/foo' com baseUrl: 'src/')
          style = 'baseUrl';
          resolvedImport = path.join(cwd, baseUrl, importPath);
        } else {
          return null;
        }
      }

      const relativeImport = path.relative(cwd, resolvedImport).replace(/\\/g, '/');
      const importWithTs = relativeImport.endsWith('.ts') ? relativeImport : `${relativeImport}.ts`;
      const newTargetPath = moveMap.get(importWithTs) ?? moveMap.get(relativeImport);

      // estilos absolutos não dependem da localização do arquivo importador:
      // se o alvo não foi movido, o import continua válido
      if (!newTargetPath && style !== 'relative') return null;
      if (!newTargetPath && !originalFileRel) return null;

      const finalTargetRel = stripTs(newTargetPath ?? relativeImport);

      if (style === 'srcAbs') {
        return finalTargetRel === importPath ? null : finalTargetRel;
      }

      if (style === 'alias') {
        const rootPrefix = aliasRoot.replace(/\/$/, '') + '/';
        if (finalTargetRel.startsWith(rootPrefix)) {
          const rewritten = `${aliasPrefix}/${finalTargetRel.slice(rootPrefix.length)}`;
          return rewritten === importPath ? null : rewritten;
        }
        // destino saiu da raiz do alias — cai para caminho relativo
      }

      if (style === 'baseUrl') {
        const basePrefix = `${baseUrl}/`;
        if (finalTargetRel.startsWith(basePrefix)) {
          const rewritten = finalTargetRel.slice(basePrefix.length);
          return rewritten === importPath ? null : rewritten;
        }
        // destino fora do baseUrl — cai para caminho relativo
      }

      const finalTargetAbs = path.join(cwd, finalTargetRel);
      const newRelative = path.relative(path.dirname(file), finalTargetAbs).replace(/\\/g, '/');
      const newRelativeWithDot = newRelative.startsWith('.') ? newRelative : `./${newRelative}`;

      if (newRelativeWithDot === importPath) return null;
      return newRelativeWithDot;
    };

    // from '...'  — cobre import ... from e export ... from
    content = content.replace(/\bfrom\s+(['"])([^'"]+)\1/g, (m, q: string, p: string) => {
      const r = rewritePath(p); if (!r) return m; changed = true; return `from ${q}${r}${q}`;
    });

    // import '...'  — side-effect imports
    content = content.replace(/\bimport\s+(['"])([^'"]+)\1/g, (m, q: string, p: string) => {
      const r = rewritePath(p); if (!r) return m; changed = true; return `import ${q}${r}${q}`;
    });

    // import('...')  — lazy imports e dynamic imports
    content = content.replace(/\bimport\s*\(\s*(['"])([^'"]+)\1\s*\)/g, (m, q: string, p: string) => {
      const r = rewritePath(p); if (!r) return m; changed = true; return `import(${q}${r}${q})`;
    });

    // templateUrl: '...'
    content = content.replace(/\btemplateUrl\s*:\s*(['"])([^'"]+)\1/g, (m, q: string, p: string) => {
      const r = rewritePath(p); if (!r) return m; changed = true; return `templateUrl: ${q}${r}${q}`;
    });

    // styleUrl: '...'
    content = content.replace(/\bstyleUrl\s*:\s*(['"])([^'"]+)\1/g, (m, q: string, p: string) => {
      const r = rewritePath(p); if (!r) return m; changed = true; return `styleUrl: ${q}${r}${q}`;
    });

    // styleUrls: ['...', '...']
    content = content.replace(/\bstyleUrls\s*:\s*\[([^\]]*)\]/g, (m, inner: string) => {
      const rewritten = inner.replace(/(['"])([^'"]+)\1/g, (sm: string, sq: string, sp: string) => {
        const r = rewritePath(sp); if (!r) return sm; changed = true; return `${sq}${r}${sq}`;
      });
      return `styleUrls: [${rewritten}]`;
    });

    if (changed) {
      fs.writeFileSync(file, content, 'utf-8');
      logger.log(`imports atualizados: ${fileRel}`);
    }
  }
}

// Retorna arquivos na mesma pasta que compartilham o mesmo prefixo base (.html, .scss, .css, .spec.ts, etc.)
// Exclui o próprio .ts principal (já foi movido) e index.ts
function getSiblingFiles(dir: string, baseName: string): string[] {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir)
    .filter((f) => {
      if (f === `${baseName}.ts`) return false; // já movido
      if (f === 'index.ts') return false;
      return f.startsWith(baseName + '.');
    })
    .map((f) => path.join(dir, f));
}
