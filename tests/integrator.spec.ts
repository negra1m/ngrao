import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { planCheckScripts, applyCheckScripts } from '../src/integrator/index.js';
import { createProject, destroyProject, readFile, ANGULAR_JSON } from './fixtures.js';

let cwd: string;
afterEach(() => destroyProject(cwd));

const BOM = '﻿';

function project(pkg: unknown, indent = 2): string {
  return createProject([
    { rel: 'angular.json', content: ANGULAR_JSON },
    { rel: 'package.json', content: JSON.stringify(pkg, null, indent) + '\n' },
  ]);
}

function scriptsOf(dir: string): Record<string, string> {
  const raw = readFile(dir, 'package.json').replace(/^[﻿]/, '');
  return (JSON.parse(raw) as { scripts: Record<string, string> }).scripts;
}

// ─── planejamento ────────────────────────────────────────────────────────────

describe('integrator › planejamento', () => {
  it('adiciona ngrao:check e encadeia no build existente', () => {
    cwd = project({ name: 'app', scripts: { build: 'ng build', test: 'ng test' } });
    const plan = planCheckScripts(cwd, 'feature-first');

    expect(plan.changes).toEqual([
      { script: 'ngrao:check', to: 'npx ng-rao check --feature-first' },
      { script: 'build', from: 'ng build', to: 'npx ng-rao check --feature-first && ng build' },
    ]);
  });

  it('usa o comando sem flag no modo clássico', () => {
    cwd = project({ name: 'app', scripts: { build: 'ng build' } });
    const plan = planCheckScripts(cwd, 'classic');

    expect(plan.changes[0].to).toBe('npx ng-rao check');
    expect(plan.changes[1].to).toBe('npx ng-rao check && ng build');
  });

  it('não inventa script de build quando o projeto não tem um', () => {
    cwd = project({ name: 'app', scripts: { test: 'ng test' } });
    const plan = planCheckScripts(cwd, 'feature-first');

    expect(plan.changes.map(c => c.script)).toEqual(['ngrao:check']);
  });

  it('funciona em package.json sem bloco scripts', () => {
    cwd = project({ name: 'app' });
    const plan = planCheckScripts(cwd, 'feature-first');

    expect(plan.changes.map(c => c.script)).toEqual(['ngrao:check']);
  });

  it('não planeja nada quando o check já está no build', () => {
    cwd = project({
      name: 'app',
      scripts: { 'ngrao:check': 'npx ng-rao check', build: 'npx ng-rao check && ng build' },
    });
    expect(planCheckScripts(cwd, 'feature-first').changes).toEqual([]);
  });

  it('reconhece o check escrito como ngrao check', () => {
    cwd = project({
      name: 'app',
      scripts: { 'ngrao:check': 'ngrao check', build: 'ngrao check --feature-first && ng build' },
    });
    expect(planCheckScripts(cwd, 'feature-first').changes).toEqual([]);
  });

  it('não sobrescreve um ngrao:check customizado pelo usuário', () => {
    cwd = project({ name: 'app', scripts: { 'ngrao:check': 'ngrao check || true' } });
    const plan = planCheckScripts(cwd, 'feature-first');

    expect(plan.changes.map(c => c.script)).not.toContain('ngrao:check');
  });

  it('ignora projeto sem package.json', () => {
    cwd = createProject([{ rel: 'angular.json', content: ANGULAR_JSON }]);
    expect(planCheckScripts(cwd, 'feature-first').changes).toEqual([]);
  });

  it('ignora package.json inválido sem quebrar', () => {
    cwd = createProject([
      { rel: 'angular.json', content: ANGULAR_JSON },
      { rel: 'package.json', content: '{ isso não é json' },
    ]);
    expect(() => planCheckScripts(cwd, 'feature-first')).not.toThrow();
    expect(planCheckScripts(cwd, 'feature-first').changes).toEqual([]);
  });
});

// ─── escrita ─────────────────────────────────────────────────────────────────

describe('integrator › escrita', () => {
  it('grava os scripts planejados', () => {
    cwd = project({ name: 'app', scripts: { build: 'ng build' } });
    applyCheckScripts(cwd, planCheckScripts(cwd, 'feature-first'));

    const scripts = scriptsOf(cwd);
    expect(scripts['ngrao:check']).toBe('npx ng-rao check --feature-first');
    expect(scripts.build).toBe('npx ng-rao check --feature-first && ng build');
  });

  it('preserva os demais scripts e campos do package.json', () => {
    cwd = project({
      name: 'app',
      version: '3.1.0',
      scripts: { start: 'ng serve', build: 'ng build', test: 'ng test' },
      dependencies: { '@angular/core': '^19.0.0' },
    });
    applyCheckScripts(cwd, planCheckScripts(cwd, 'classic'));

    const pkg = JSON.parse(readFile(cwd, 'package.json')) as Record<string, unknown>;
    expect(pkg.version).toBe('3.1.0');
    expect(pkg.dependencies).toEqual({ '@angular/core': '^19.0.0' });
    expect(scriptsOf(cwd).start).toBe('ng serve');
    expect(scriptsOf(cwd).test).toBe('ng test');
  });

  it('não mexe em dependencies nem devDependencies', () => {
    cwd = project({ name: 'app', scripts: { build: 'ng build' }, devDependencies: { typescript: '^5.5.0' } });
    applyCheckScripts(cwd, planCheckScripts(cwd, 'feature-first'));

    const pkg = JSON.parse(readFile(cwd, 'package.json')) as Record<string, unknown>;
    expect(pkg.devDependencies).toEqual({ typescript: '^5.5.0' });
    expect(pkg.dependencies).toBeUndefined();
  });

  it('preserva indentação de 4 espaços e newline final', () => {
    cwd = project({ name: 'app', scripts: { build: 'ng build' } }, 4);
    applyCheckScripts(cwd, planCheckScripts(cwd, 'feature-first'));

    const raw = readFile(cwd, 'package.json');
    expect(raw).toContain('\n    "name"');
    expect(raw.endsWith('\n')).toBe(true);
  });

  it('é idempotente — segunda passada não planeja nem altera nada', () => {
    cwd = project({ name: 'app', scripts: { build: 'ng build' } });
    applyCheckScripts(cwd, planCheckScripts(cwd, 'feature-first'));
    const afterFirst = readFile(cwd, 'package.json');

    applyCheckScripts(cwd, planCheckScripts(cwd, 'feature-first'));

    expect(planCheckScripts(cwd, 'feature-first').changes).toEqual([]);
    expect(readFile(cwd, 'package.json')).toBe(afterFirst);
  });

  it('não encadeia duas vezes ao trocar de modo', () => {
    cwd = project({ name: 'app', scripts: { build: 'ng build' } });
    applyCheckScripts(cwd, planCheckScripts(cwd, 'classic'));
    applyCheckScripts(cwd, planCheckScripts(cwd, 'feature-first'));

    expect(scriptsOf(cwd).build).toBe('npx ng-rao check && ng build');
  });

  it('lê e regrava package.json com BOM', () => {
    cwd = createProject([
      { rel: 'angular.json', content: ANGULAR_JSON },
      {
        rel: 'package.json',
        content: BOM + JSON.stringify({ name: 'app', scripts: { build: 'ng build' } }, null, 2) + '\n',
      },
    ]);

    const plan = planCheckScripts(cwd, 'feature-first');
    expect(plan.changes.length).toBe(2);

    applyCheckScripts(cwd, plan);

    const raw = readFile(cwd, 'package.json');
    expect(raw.charCodeAt(0)).toBe(0xfeff);
    expect(scriptsOf(cwd).build).toBe('npx ng-rao check --feature-first && ng build');
  });

  it('não escreve nada quando o plano está vazio', () => {
    cwd = project({ name: 'app', scripts: { build: 'ng build' } });
    const before = readFile(cwd, 'package.json');

    applyCheckScripts(cwd, { changes: [] });

    expect(readFile(cwd, 'package.json')).toBe(before);
  });
});
