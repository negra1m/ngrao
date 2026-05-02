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
    }
  }

  if (moveMap.size > 0) {
    rewriteImports(cwd, moveMap);
  }

  return report;
}

// Reescreve imports em todos os .ts do projeto para refletir os moves
function rewriteImports(cwd: string, moveMap: Map<string, string>): void {
  const appRoot = path.join(cwd, 'src', 'app');
  const allTs = walkTs(appRoot);

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

    const importRegex = /from\s+['"]([^'"]+)['"]/g;
    content = content.replace(importRegex, (match, importPath: string) => {
      if (!importPath.startsWith('.')) return match;

      const resolvedImport = path.resolve(effectiveFileDir, importPath);
      const relativeImport = path.relative(cwd, resolvedImport).replace(/\\/g, '/');

      const importWithTs = relativeImport.endsWith('.ts') ? relativeImport : `${relativeImport}.ts`;

      const newPath = moveMap.get(importWithTs) ?? moveMap.get(relativeImport);
      if (!newPath) return match;

      // calcula o novo import relativo a partir da localização atual do arquivo
      const newAbsPath = path.join(cwd, newPath.replace(/\.ts$/, ''));
      const newRelative = path.relative(path.dirname(file), newAbsPath).replace(/\\/g, '/');
      const newRelativeWithDot = newRelative.startsWith('.') ? newRelative : `./${newRelative}`;

      changed = true;
      return match.replace(importPath, newRelativeWithDot);
    });

    if (changed) {
      fs.writeFileSync(file, content, 'utf-8');
      logger.log(`imports atualizados: ${fileRel}`);
    }
  }
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
