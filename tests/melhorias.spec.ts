import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import { collectFiles } from '../src/classifier/index.js';
import { buildPlan, TEMPLATE } from '../src/architect/index.js';
import { execute } from '../src/writer/index.js';
import { isConfirmation } from '../src/commands/apply.js';
import { stripJsonComments, readAliasPaths, readBaseUrl } from '../src/utils/tsconfig.js';
import { buildBarrelContent } from '../src/utils/barrel.js';
import {
  createProject, destroyProject, exists, readFile,
  component, service, guard, model,
  ANGULAR_JSON, PACKAGE_JSON,
} from './fixtures.js';

let cwd: string;
beforeEach(() => {
  cwd = createProject([
    { rel: 'angular.json', content: ANGULAR_JSON },
    { rel: 'package.json', content: PACKAGE_JSON },
  ]);
});
afterEach(() => destroyProject(cwd));

function write(rel: string, content: string) {
  const full = path.join(cwd, rel);
  fs.mkdirSync(path.dirname(full), { recursive: true });
  fs.writeFileSync(full, content);
}

// ─── confirmação do apply ────────────────────────────────────────────────────

describe('apply › isConfirmation', () => {
  it('Enter vazio confirma', () => {
    expect(isConfirmation('')).toBe(true);
    expect(isConfirmation('  ')).toBe(true);
  });

  it('y / yes / s / sim confirmam (case-insensitive)', () => {
    expect(isConfirmation('y')).toBe(true);
    expect(isConfirmation('yes')).toBe(true);
    expect(isConfirmation('s')).toBe(true);
    expect(isConfirmation('sim')).toBe(true);
    expect(isConfirmation('S')).toBe(true);
    expect(isConfirmation('YES')).toBe(true);
  });

  it('n / no / nao / qualquer outra resposta cancela', () => {
    expect(isConfirmation('n')).toBe(false);
    expect(isConfirmation('no')).toBe(false);
    expect(isConfirmation('nao')).toBe(false);
    expect(isConfirmation('não')).toBe(false);
    expect(isConfirmation('cancel')).toBe(false);
    expect(isConfirmation('x')).toBe(false);
  });
});

// ─── parsing de tsconfig (JSONC) ─────────────────────────────────────────────

describe('utils › tsconfig JSONC', () => {
  it('remove comentários trailing sem quebrar o JSON', () => {
    const raw = `{
      "compilerOptions": { // comentário trailing
        "baseUrl": "src" /* bloco */
      }
    }`;
    const parsed = JSON.parse(stripJsonComments(raw));
    expect(parsed.compilerOptions.baseUrl).toBe('src');
  });

  it('não toca em // e /* dentro de strings', () => {
    const raw = `{ "url": "https://example.com", "glob": "src/**/*" }`;
    const parsed = JSON.parse(stripJsonComments(raw));
    expect(parsed.url).toBe('https://example.com');
    expect(parsed.glob).toBe('src/**/*');
  });

  it('remove trailing commas', () => {
    const raw = `{ "a": 1, "b": [1, 2,], }`;
    const parsed = JSON.parse(stripJsonComments(raw));
    expect(parsed.a).toBe(1);
    expect(parsed.b).toEqual([1, 2]);
  });

  it('lê paths de tsconfig com comentários trailing', () => {
    write('tsconfig.json', `{
      "compilerOptions": {
        "baseUrl": "./", // default
        "paths": {
          "@env/*": ["src/environments/*"], // alias de environments
        },
      }
    }`);
    const aliases = readAliasPaths(cwd);
    expect(aliases.get('@env')).toBe('src/environments');
  });

  it('tsconfig malformado não lança erro (gera warn e ignora)', () => {
    write('tsconfig.json', '{ this is not json !!!');
    expect(() => readAliasPaths(cwd)).not.toThrow();
    expect(readAliasPaths(cwd).size).toBe(0);
    expect(readBaseUrl(cwd)).toBeNull();
  });
});

// ─── rotas standalone (Angular 19+) ──────────────────────────────────────────

describe('classifier › rotas standalone', () => {
  it('component eager em app.routes.ts → page', () => {
    write('src/app/app.routes.ts', `
      import { Routes } from '@angular/router';
      export const routes: Routes = [
        { path: '', component: HomeComponent },
      ];
    `);
    write('src/app/home.component.ts', component('HomeComponent'));
    const [f] = collectFiles(cwd);
    expect(f.role).toBe('page');
  });

  it('loadComponent lazy em app.routes.ts → page', () => {
    write('src/app/app.routes.ts', `
      import { Routes } from '@angular/router';
      export const routes: Routes = [
        { path: 'login', loadComponent: () => import('./login.component').then(m => m.LoginComponent) },
        { path: 'about', loadComponent: () => import('./about.component').then((c) => c.AboutComponent) },
      ];
    `);
    write('src/app/login.component.ts', component('LoginComponent'));
    write('src/app/about.component.ts', component('AboutComponent'));
    write('src/app/card.component.ts', component('CardComponent'));
    const files = collectFiles(cwd);
    const byName = Object.fromEntries(files.map((f) => [f.filename, f.role]));
    expect(byName['login.component.ts']).toBe('page');
    expect(byName['about.component.ts']).toBe('page');
    expect(byName['card.component.ts']).toBe('component');
  });

  it('feature.routes.ts em subpasta também é lido', () => {
    write('src/app/modules/admin/admin.routes.ts', `
      export const routes = [
        { path: '', loadComponent: () => import('./pages/admin-home/admin-home.component').then(m => m.AdminHomeComponent) },
      ];
    `);
    write('src/app/modules/admin/pages/admin-home/admin-home.component.ts', component('AdminHomeComponent'));
    const files = collectFiles(cwd);
    const page = files.find((f) => f.filename === 'admin-home.component.ts');
    expect(page?.role).toBe('page');
  });

  it('arquivos *.routes.ts não são coletados para mover', () => {
    write('src/app/app.routes.ts', 'export const routes = [];');
    expect(collectFiles(cwd)).toHaveLength(0);
  });
});

// ─── scope ancorado em src/app/shared/ ───────────────────────────────────────

describe('classifier › shared ancorado', () => {
  it('service em modules/[x]/shared/ é feature, não shared', () => {
    write('src/app/modules/dashboard/shared/widget.service.ts', service('WidgetService', false));
    const [f] = collectFiles(cwd);
    expect(f.scope).toBe('feature');
    expect(f.domain).toBe('dashboard');
  });

  it('service em src/app/shared/ continua shared', () => {
    write('src/app/shared/components/sidebar/services/sidebar.service.ts', service('SidebarService', false));
    const [f] = collectFiles(cwd);
    expect(f.scope).toBe('shared');
  });
});

// ─── domain longest-match ────────────────────────────────────────────────────

describe('classifier › domain longest-match', () => {
  it('prefere módulo existente com nome composto', () => {
    write('src/app/modules/user-profile/pages/.keep', '');
    write('src/app/user-profile.service.ts', service('UserProfileService', false));
    const files = collectFiles(cwd);
    const svc = files.find((f) => f.filename === 'user-profile.service.ts');
    expect(svc?.domain).toBe('user-profile');
  });

  it('sem módulo correspondente, usa o primeiro segmento', () => {
    write('src/app/user-profile.service.ts', service('UserProfileService', false));
    const [f] = collectFiles(cwd);
    expect(f.domain).toBe('user');
  });
});

// ─── plano sem ações fantasma ────────────────────────────────────────────────

describe('architect › projeto conforme não gera ações', () => {
  it('estrutura completa + arquivo no lugar → apenas skips', () => {
    for (const entry of TEMPLATE) {
      fs.mkdirSync(path.join(cwd, entry.path), { recursive: true });
      if (entry.needsBarrel) {
        write(`${entry.path}/index.ts`, '// barrel\n');
      }
    }
    write('src/app/core/guards/auth.guard.ts', guard('AuthGuard'));
    write('src/app/core/guards/index.ts', "export * from './auth.guard';\n");

    const files = collectFiles(cwd);
    const plan = buildPlan(files, cwd);
    const actionable = plan.filter((a) => a.type !== 'skip');
    expect(actionable).toHaveLength(0);
  });

  it('estrutura parcial → cria apenas o que falta', () => {
    fs.mkdirSync(path.join(cwd, 'src/app/core/guards'), { recursive: true });
    write('src/app/core/guards/index.ts', '// barrel\n');

    const plan = buildPlan([], cwd);
    const dirs = plan.filter((a) => a.type === 'create_dir').map((a) => a.to);
    const barrels = plan.filter((a) => a.type === 'create_barrel').map((a) => a.to);

    expect(dirs).not.toContain('src/app/core/guards');
    expect(barrels).not.toContain('src/app/core/guards/index.ts');
    expect(dirs).toContain('src/app/core/interceptors');
    expect(barrels).toContain('src/app/core/interceptors/index.ts');
  });
});

// ─── barrels com exports reais ───────────────────────────────────────────────

describe('writer › barrels exportam os arquivos da pasta', () => {
  it('barrel criado após move re-exporta o arquivo movido', () => {
    write('src/app/auth.guard.ts', guard('AuthGuard'));

    const files = collectFiles(cwd);
    const plan = buildPlan(files, cwd);
    execute(plan, cwd);

    const barrel = readFile(cwd, 'src/app/core/guards/index.ts');
    expect(barrel).toContain(`export * from './auth.guard';`);
  });

  it('barrel de pasta vazia usa placeholder', () => {
    const dir = path.join(cwd, 'empty-folder');
    fs.mkdirSync(dir, { recursive: true });
    const content = buildBarrelContent(dir, '// fallback\n');
    expect(content).toBe('// fallback\n');
  });

  it('buildBarrelContent ignora spec, index e d.ts', () => {
    const dir = path.join(cwd, 'some-folder');
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, 'a.service.ts'), '');
    fs.writeFileSync(path.join(dir, 'a.service.spec.ts'), '');
    fs.writeFileSync(path.join(dir, 'index.ts'), '');
    fs.writeFileSync(path.join(dir, 'types.d.ts'), '');
    const content = buildBarrelContent(dir);
    expect(content).toBe(`export * from './a.service';\n`);
  });
});

// ─── preservação de estilo de import ─────────────────────────────────────────

describe('writer › estilo de import preservado', () => {
  it('import por alias em arquivo movido permanece alias', () => {
    write('tsconfig.json', JSON.stringify({
      compilerOptions: { paths: { '@env/*': ['src/environments/*'] } },
    }));
    write('src/environments/environment.ts', 'export const environment = {};');
    write('src/app/foo.service.ts',
      `import { environment } from '@env/environment';\n${service('FooService', true)}`);

    const files = collectFiles(cwd);
    const plan = buildPlan(files, cwd);
    execute(plan, cwd);

    const moved = readFile(cwd, 'src/app/core/services/foo/foo.service.ts');
    expect(moved).toContain(`from '@env/environment'`);
  });

  it('import src-absoluto para alvo movido mantém estilo absoluto', () => {
    write('src/app/user.model.ts', model('UserModel'));
    write('src/app/app.component.ts',
      `import { UserModel } from 'src/app/user.model';\n@Component({}) export class AppComponent {}`);

    const files = collectFiles(cwd);
    const plan = buildPlan(files, cwd);
    execute(plan, cwd);

    const c = readFile(cwd, 'src/app/app.component.ts');
    expect(c).toContain(`from 'src/app/core/models/user/user.model'`);
  });

  it('import src-absoluto em arquivo movido para alvo não movido fica intacto', () => {
    write('src/app/core/models/user/user.model.ts', model('UserModel'));
    write('src/app/foo.service.ts',
      `import { UserModel } from 'src/app/core/models/user/user.model';\n${service('FooService', true)}`);

    const files = collectFiles(cwd);
    const plan = buildPlan(files, cwd);
    execute(plan, cwd);

    const moved = readFile(cwd, 'src/app/core/services/foo/foo.service.ts');
    expect(moved).toContain(`from 'src/app/core/models/user/user.model'`);
  });

  it('import via baseUrl mantém estilo baseUrl', () => {
    write('tsconfig.json', JSON.stringify({
      compilerOptions: { baseUrl: 'src' },
    }));
    write('src/app/user.model.ts', model('UserModel'));
    write('src/app/app.component.ts',
      `import { UserModel } from 'app/user.model';\n@Component({}) export class AppComponent {}`);

    const files = collectFiles(cwd);
    const plan = buildPlan(files, cwd);
    execute(plan, cwd);

    const c = readFile(cwd, 'src/app/app.component.ts');
    expect(c).toContain(`from 'app/core/models/user/user.model'`);
  });

  it('side-effect import é reescrito após move', () => {
    write('src/app/user.model.ts', model('UserModel'));
    write('src/app/app.component.ts',
      `import './user.model';\n@Component({}) export class AppComponent {}`);

    const files = collectFiles(cwd);
    const plan = buildPlan(files, cwd);
    execute(plan, cwd);

    const c = readFile(cwd, 'src/app/app.component.ts');
    expect(c).toContain(`import './core/models/user/user.model'`);
  });
});

// ─── pipeline standalone end-to-end ──────────────────────────────────────────

describe('e2e › projeto standalone', () => {
  it('page lazy vai para pages/, componente comum para components/', () => {
    write('src/app/app.routes.ts', `
      export const routes = [
        { path: 'login', loadComponent: () => import('./login.component').then(m => m.LoginComponent) },
      ];
    `);
    write('src/app/login.component.ts', component('LoginComponent'));
    write('src/app/alarm-card.component.ts', component('AlarmCardComponent'));

    const files = collectFiles(cwd);
    const plan = buildPlan(files, cwd);
    execute(plan, cwd);

    expect(exists(cwd, 'src/app/modules/login/pages/login/login.component.ts')).toBe(true);
    expect(exists(cwd, 'src/app/modules/alarm/components/alarm-card/alarm-card.component.ts')).toBe(true);
    // o import lazy no app.routes.ts é reescrito
    const routes = readFile(cwd, 'src/app/app.routes.ts');
    expect(routes).toContain('modules/login/pages/login/login.component');
  });
});
