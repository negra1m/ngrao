import fs from 'fs';
import path from 'path';
import { logger } from '../logger/index.js';

const CANDIDATES = ['tsconfig.json', 'tsconfig.app.json', 'tsconfig.base.json'];

// Remove comentários // e /* */ de JSONC sem tocar em strings,
// e remove trailing commas antes de } ou ]
export function stripJsonComments(input: string): string {
  let out = '';
  let inString = false;
  let inLine = false;
  let inBlock = false;

  for (let i = 0; i < input.length; i++) {
    const c = input[i];
    const n = input[i + 1];

    if (inLine) {
      if (c === '\n') {
        inLine = false;
        out += c;
      }
      continue;
    }
    if (inBlock) {
      if (c === '*' && n === '/') {
        inBlock = false;
        i++;
      }
      continue;
    }
    if (inString) {
      out += c;
      if (c === '\\') {
        out += n ?? '';
        i++;
      } else if (c === '"') {
        inString = false;
      }
      continue;
    }
    if (c === '"') {
      inString = true;
      out += c;
      continue;
    }
    if (c === '/' && n === '/') {
      inLine = true;
      continue;
    }
    if (c === '/' && n === '*') {
      inBlock = true;
      i++;
      continue;
    }
    out += c;
  }

  return out.replace(/,\s*([}\]])/g, '$1');
}

interface TsconfigLike {
  compilerOptions?: {
    baseUrl?: string;
    paths?: Record<string, string[]>;
  };
}

// Lê e parseia os tsconfigs candidatos. Falha de parse gera warn (não silencia).
export function readTsconfigs(cwd: string, candidates: string[] = CANDIDATES): TsconfigLike[] {
  const results: TsconfigLike[] = [];
  for (const candidate of candidates) {
    const tsconfigPath = path.join(cwd, candidate);
    if (!fs.existsSync(tsconfigPath)) continue;
    try {
      // tsconfig gravado por editor Windows pode vir com BOM — JSON.parse não aceita
      const raw = fs.readFileSync(tsconfigPath, 'utf-8');
      const withoutBom = raw.charCodeAt(0) === 0xfeff ? raw.slice(1) : raw;
      results.push(JSON.parse(stripJsonComments(withoutBom)) as TsconfigLike);
    } catch {
      logger.warn(
        `não foi possível parsear ${candidate} — baseUrl/paths deste arquivo serão ignorados. ` +
        `Imports por alias podem não ser reescritos corretamente.`
      );
    }
  }
  return results;
}

// Mapa de prefixo de alias → raiz no disco. ex: "@core" → "src/app/core"
export function readAliasPaths(cwd: string): Map<string, string> {
  const result = new Map<string, string>();
  for (const tsconfig of readTsconfigs(cwd)) {
    const paths = tsconfig.compilerOptions?.paths ?? {};
    for (const [alias, targets] of Object.entries(paths)) {
      const prefix = alias.replace(/\/\*$/, '');
      const root = (targets[0] ?? '').replace(/\/\*$/, '').replace(/\\/g, '/');
      if (prefix && root && !result.has(prefix)) result.set(prefix, root);
    }
  }
  return result;
}

// Todas as raízes no disco cobertas por algum alias (inclui múltiplos targets)
export function readAliasRoots(cwd: string): string[] {
  const roots = new Set<string>();
  for (const tsconfig of readTsconfigs(cwd)) {
    const paths = tsconfig.compilerOptions?.paths ?? {};
    for (const targets of Object.values(paths)) {
      for (const target of targets) {
        const root = target.replace(/\/\*$/, '').replace(/\\/g, '/');
        if (root) roots.add(root);
      }
    }
  }
  return [...roots];
}

// baseUrl customizado (ex: "src") ou null quando ausente/default
export function readBaseUrl(cwd: string): string | null {
  for (const tsconfig of readTsconfigs(cwd, ['tsconfig.json', 'tsconfig.app.json'])) {
    const baseUrl = tsconfig.compilerOptions?.baseUrl;
    if (baseUrl && baseUrl !== './' && baseUrl !== '.') {
      return baseUrl.replace(/\\/g, '/').replace(/\/$/, '');
    }
  }
  return null;
}
