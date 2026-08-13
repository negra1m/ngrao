import fs from 'fs';
import path from 'path';
import type { LayoutMode } from '../types.js';
import { logger } from '../logger/index.js';

const CHECK_SCRIPT = 'ngrao:check';
const BOM = '﻿';

// npx em vez de devDependency: adicionar a dependência sem rodar npm install
// deixaria o package-lock.json fora de sincronia e quebraria `npm ci` no CI
// de quem adota. Com npx o script funciona no dia seguinte ao apply.
function checkCommandFor(mode: LayoutMode): string {
  return mode === 'feature-first' ? 'npx ng-rao check --feature-first' : 'npx ng-rao check';
}

export interface ScriptChange {
  script: string;   // nome do script no package.json
  from?: string;    // valor anterior (quando é encadeamento)
  to: string;       // valor final
}

export interface IntegrationPlan {
  changes: ScriptChange[];
}

interface PackageJsonLike {
  scripts?: Record<string, string>;
  [key: string]: unknown;
}

// Já existe algum "ngrao check" / "ng-rao check" no script?
function hasCheck(script: string): boolean {
  return /\b(?:ng-rao|ngrao)\s+check\b/.test(script);
}

// Planeja a validação de arquitetura no package.json do projeto:
// um script dedicado + encadeamento no build existente.
// Nunca sobrescreve script do usuário e nunca duplica — a segunda passada não muda nada.
export function planCheckScripts(cwd: string, mode: LayoutMode): IntegrationPlan {
  const pkg = readPackageJson(cwd);
  if (!pkg) return { changes: [] };

  const command = checkCommandFor(mode);
  const scripts = pkg.scripts ?? {};
  const changes: ScriptChange[] = [];

  if (!scripts[CHECK_SCRIPT]) {
    changes.push({ script: CHECK_SCRIPT, to: command });
  }

  // só encadeia num build que já existe — não inventa build para o projeto
  const build = scripts.build;
  if (build && !hasCheck(build)) {
    changes.push({ script: 'build', from: build, to: `${command} && ${build}` });
  }

  return { changes };
}

export function applyCheckScripts(cwd: string, plan: IntegrationPlan): void {
  if (plan.changes.length === 0) return;

  const pkgPath = path.join(cwd, 'package.json');
  const raw = fs.readFileSync(pkgPath, 'utf-8');

  let pkg: PackageJsonLike;
  try {
    pkg = JSON.parse(stripBom(raw)) as PackageJsonLike;
  } catch {
    logger.warn('package.json inválido — validação de arquitetura não foi adicionada.');
    return;
  }

  const scripts: Record<string, string> = { ...pkg.scripts };
  for (const change of plan.changes) {
    scripts[change.script] = change.to;
  }
  pkg.scripts = scripts;

  fs.writeFileSync(pkgPath, serialize(pkg, raw), 'utf-8');

  for (const change of plan.changes) {
    logger.script(change.script, change.to);
  }
}

function readPackageJson(cwd: string): PackageJsonLike | null {
  const pkgPath = path.join(cwd, 'package.json');
  if (!fs.existsSync(pkgPath)) return null;
  try {
    return JSON.parse(stripBom(fs.readFileSync(pkgPath, 'utf-8'))) as PackageJsonLike;
  } catch {
    logger.warn('não foi possível parsear package.json — validação de arquitetura será ignorada.');
    return null;
  }
}

// package.json gravado por editor Windows costuma vir com BOM — JSON.parse não aceita
function stripBom(raw: string): string {
  return raw.charCodeAt(0) === 0xfeff ? raw.slice(1) : raw;
}

// Reserializa preservando BOM, indentação, quebra de linha e newline final do original
function serialize(pkg: PackageJsonLike, raw: string): string {
  const hadBom = raw.charCodeAt(0) === 0xfeff;
  const body = stripBom(raw);

  const indentMatch = body.match(/\n([ \t]+)"/);
  const indent = indentMatch ? indentMatch[1] : '  ';
  const trailingNewline = /\r?\n$/.test(body) ? (body.endsWith('\r\n') ? '\r\n' : '\n') : '';

  let out = JSON.stringify(pkg, null, indent) + trailingNewline;
  if (body.includes('\r\n')) out = out.replace(/(?<!\r)\n/g, '\r\n');

  return hadBom ? BOM + out : out;
}
