import fs from 'fs';
import path from 'path';
import type { ActionPlan, Report } from '../types.js';
import { logger } from '../logger/index.js';

export function execute(plan: ActionPlan, cwd: string): Report {
  const report: Report = { moved: 0, created: 0, barrels: 0, skipped: 0 };

  // mapa de moves: caminho antigo → novo (para reescrever imports depois)
  const moveMap = new Map<string, string>();

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
        fs.writeFileSync(toAbs, action.content ?? '// barrel\n', 'utf-8');
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

  if (moveMap.size > 0) {
    rewriteImports(cwd, moveMap);
  }

  return report;
}

// Reescreve imports em todos os .ts do projeto para refletir os moves
function rewriteImports(cwd: string, moveMap: Map<string, string>): void {
  const srcRoot = path.join(cwd, 'src');
  const allTs = walkTs(srcRoot);

  // lê baseUrl e aliases do tsconfig para resolver imports absolutos
  const baseUrl = readBaseUrl(cwd);
  const aliasPaths = readAliasPaths(cwd);

  // mapa inverso: novo caminho → caminho original (para arquivos que foram movidos)
  const reverseMap = new Map<string, string>();
  for (const [from, to] of moveMap) {
    reverseMap.set(to, from);
  }

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

      if (importPath.startsWith('.')) {
        resolvedImport = path.resolve(effectiveFileDir, importPath);
      } else if (importPath.startsWith('src/')) {
        resolvedImport = path.join(cwd, importPath);
      } else if (importPath.startsWith('@')) {
        // import via path alias (ex: '@core/services/foo') — resolve usando mapa do tsconfig
        let aliasResolved: string | null = null;
        for (const [prefix, root] of aliasPaths) {
          if (importPath === prefix || importPath.startsWith(prefix + '/')) {
            const rest = importPath.slice(prefix.length).replace(/^\//, '');
            aliasResolved = path.join(cwd, root, rest);
            break;
          }
        }
        if (!aliasResolved) return null;
        resolvedImport = aliasResolved;
      } else if (baseUrl && !importPath.startsWith('@')) {
        // import absoluto com baseUrl customizado (ex: 'app/services/foo' com baseUrl: 'src/')
        resolvedImport = path.join(cwd, baseUrl, importPath);
      } else {
        return null;
      }

      const relativeImport = path.relative(cwd, resolvedImport).replace(/\\/g, '/');
      const importWithTs = relativeImport.endsWith('.ts') ? relativeImport : `${relativeImport}.ts`;
      const newTargetPath = moveMap.get(importWithTs) ?? moveMap.get(relativeImport);
      const finalTargetRel = newTargetPath ?? relativeImport;

      if (!newTargetPath && !originalFileRel) return null;

      const finalTargetAbs = path.join(cwd, finalTargetRel.replace(/\.ts$/, ''));
      const newRelative = path.relative(path.dirname(file), finalTargetAbs).replace(/\\/g, '/');
      const newRelativeWithDot = newRelative.startsWith('.') ? newRelative : `./${newRelative}`;

      if (newRelativeWithDot === importPath) return null;
      return newRelativeWithDot;
    };

    // from '...'
    content = content.replace(/\bfrom\s+(['"])([^'"]+)\1/g, (m, q: string, p: string) => {
      const r = rewritePath(p); if (!r) return m; changed = true; return `from ${q}${r}${q}`;
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

// Lê o baseUrl do tsconfig para resolver imports absolutos (ex: baseUrl: "src/")
function readBaseUrl(cwd: string): string | null {
  const candidates = ['tsconfig.json', 'tsconfig.app.json'];
  for (const candidate of candidates) {
    const tsconfigPath = path.join(cwd, candidate);
    if (!fs.existsSync(tsconfigPath)) continue;
    try {
      const raw = fs.readFileSync(tsconfigPath, 'utf-8');
      const stripped = raw
        .split('\n')
        .filter((line) => !/^\s*(\/\/|\/\*)/.test(line))
        .join('\n');
      const tsconfig = JSON.parse(stripped);
      const baseUrl: string | undefined = tsconfig?.compilerOptions?.baseUrl;
      if (baseUrl && baseUrl !== './' && baseUrl !== '.') return baseUrl.replace(/\\/g, '/').replace(/\/$/, '');
    } catch {
      // ignora
    }
  }
  return null;
}

// Lê os path aliases do tsconfig — retorna mapa de prefixo → raiz no disco
// ex: "@core/*" → "src/app/core"
function readAliasPaths(cwd: string): Map<string, string> {
  const result = new Map<string, string>();
  const candidates = ['tsconfig.json', 'tsconfig.app.json', 'tsconfig.base.json'];
  for (const candidate of candidates) {
    const tsconfigPath = path.join(cwd, candidate);
    if (!fs.existsSync(tsconfigPath)) continue;
    try {
      const raw = fs.readFileSync(tsconfigPath, 'utf-8');
      const stripped = raw
        .split('\n')
        .filter((line) => !/^\s*(\/\/|\/\*)/.test(line))
        .join('\n');
      const tsconfig = JSON.parse(stripped);
      const paths: Record<string, string[]> = tsconfig?.compilerOptions?.paths ?? {};
      for (const [alias, targets] of Object.entries(paths)) {
        const prefix = alias.replace(/\/\*$/, '');
        const root = (targets[0] ?? '').replace(/\/\*$/, '').replace(/\\/g, '/');
        if (prefix && root) result.set(prefix, root);
      }
    } catch {
      // ignora
    }
  }
  return result;
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

function walkTs(dir: string): string[] {
  const results: string[] = [];
  if (!fs.existsSync(dir)) return results;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) results.push(...walkTs(full));
    else if (entry.name.endsWith('.ts')) results.push(full);
  }
  return results;
}
