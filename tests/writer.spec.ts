import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import { execute } from '../src/writer/index.js';
import {
  createProject, destroyProject, exists, readFile,
  component, service, guard, interceptor, model, pipe, normalizer, routing,
  ANGULAR_JSON, PACKAGE_JSON,
} from './fixtures.js';
import { collectFiles } from '../src/classifier/index.js';
import { buildPlan } from '../src/architect/index.js';

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

// ─── create_dir ──────────────────────────────────────────────────────────────

describe('writer › create_dir', () => {
  it('cria diretório que não existe', () => {
    execute([{ type: 'create_dir', to: 'src/app/core/guards' }], cwd);
    expect(exists(cwd, 'src/app/core/guards')).toBe(true);
  });

  it('não falha quando diretório já existe', () => {
    write('src/app/core/guards/.keep', '');
    expect(() =>
      execute([{ type: 'create_dir', to: 'src/app/core/guards' }], cwd)
    ).not.toThrow();
  });

  it('cria múltiplos diretórios em sequência', () => {
    execute([
      { type: 'create_dir', to: 'src/app/core' },
      { type: 'create_dir', to: 'src/app/core/guards' },
      { type: 'create_dir', to: 'src/app/core/interceptors' },
      { type: 'create_dir', to: 'src/app/modules' },
    ], cwd);
    expect(exists(cwd, 'src/app/core')).toBe(true);
    expect(exists(cwd, 'src/app/core/guards')).toBe(true);
    expect(exists(cwd, 'src/app/core/interceptors')).toBe(true);
    expect(exists(cwd, 'src/app/modules')).toBe(true);
  });

  it('report.created conta apenas dirs criados (não os que já existiam)', () => {
    write('src/app/core/.keep', '');
    const report = execute([
      { type: 'create_dir', to: 'src/app/core' },
      { type: 'create_dir', to: 'src/app/core/guards' },
    ], cwd);
    expect(report.created).toBe(1); // apenas guards foi criado
  });
});

// ─── create_barrel ───────────────────────────────────────────────────────────

describe('writer › create_barrel', () => {
  it('cria barrel com conteúdo correto', () => {
    execute([{
      type: 'create_barrel',
      to: 'src/app/core/guards/index.ts',
      content: '// barrel — re-exporte os arquivos desta pasta aqui\n',
    }], cwd);
    const c = readFile(cwd, 'src/app/core/guards/index.ts');
    expect(c).toContain('barrel');
  });

  it('cria diretório pai automaticamente se não existir', () => {
    execute([{
      type: 'create_barrel',
      to: 'src/app/core/new-folder/index.ts',
      content: '// barrel\n',
    }], cwd);
    expect(exists(cwd, 'src/app/core/new-folder/index.ts')).toBe(true);
  });

  it('não sobrescreve barrel existente com exports reais', () => {
    write('src/app/core/guards/index.ts', 'export * from "./auth.guard";\nexport * from "./role.guard";\n');
    execute([{
      type: 'create_barrel',
      to: 'src/app/core/guards/index.ts',
      content: '// barrel\n',
    }], cwd);
    const c = readFile(cwd, 'src/app/core/guards/index.ts');
    expect(c).toContain('auth.guard');
    expect(c).toContain('role.guard');
  });

  it('preserva barrel existente e incrementa report.skipped', () => {
    write('src/app/core/guards/index.ts', 'export * from "./auth.guard";\n');
    const report = execute([{
      type: 'create_barrel',
      to: 'src/app/core/guards/index.ts',
      content: '// barrel\n',
    }], cwd);
    expect(report.skipped).toBe(1);
    expect(report.barrels).toBe(0);
  });

  it('múltiplos barrels criados incrementam report.barrels corretamente', () => {
    const report = execute([
      { type: 'create_barrel', to: 'src/app/core/guards/index.ts', content: '// barrel\n' },
      { type: 'create_barrel', to: 'src/app/core/interceptors/index.ts', content: '// barrel\n' },
      { type: 'create_barrel', to: 'src/app/shared/pipes/index.ts', content: '// barrel\n' },
    ], cwd);
    expect(report.barrels).toBe(3);
  });
});

// ─── move ────────────────────────────────────────────────────────────────────

describe('writer › move', () => {
  it('move arquivo para destino correto', () => {
    write('src/app/auth.guard.ts', guard('AuthGuard'));
    execute([
      { type: 'create_dir', to: 'src/app/core/guards' },
      { type: 'move', from: 'src/app/auth.guard.ts', to: 'src/app/core/guards/auth.guard.ts' },
    ], cwd);
    expect(exists(cwd, 'src/app/core/guards/auth.guard.ts')).toBe(true);
    expect(exists(cwd, 'src/app/auth.guard.ts')).toBe(false);
  });

  it('conteúdo do arquivo é preservado após move', () => {
    const content = guard('AuthGuard');
    write('src/app/auth.guard.ts', content);
    execute([
      { type: 'create_dir', to: 'src/app/core/guards' },
      { type: 'move', from: 'src/app/auth.guard.ts', to: 'src/app/core/guards/auth.guard.ts' },
    ], cwd);
    expect(readFile(cwd, 'src/app/core/guards/auth.guard.ts')).toBe(content);
  });

  it('não move arquivo que não existe no disco', () => {
    const report = execute([{
      type: 'move',
      from: 'src/app/nonexistent.service.ts',
      to: 'src/app/core/services/foo/nonexistent.service.ts',
    }], cwd);
    expect(report.moved).toBe(0);
    expect(report.skipped).toBe(1);
  });

  it('não sobrescreve arquivo já existente no destino', () => {
    write('src/app/auth.guard.ts', 'ORIGINAL_SOURCE');
    write('src/app/core/guards/auth.guard.ts', 'ALREADY_HERE');
    execute([{
      type: 'move',
      from: 'src/app/auth.guard.ts',
      to: 'src/app/core/guards/auth.guard.ts',
    }], cwd);
    expect(readFile(cwd, 'src/app/core/guards/auth.guard.ts')).toBe('ALREADY_HERE');
    expect(exists(cwd, 'src/app/auth.guard.ts')).toBe(true); // original permanece
  });

  it('cria pasta de destino automaticamente se não existir antes do move', () => {
    write('src/app/login.service.ts', service('LoginService'));
    execute([{
      type: 'move',
      from: 'src/app/login.service.ts',
      to: 'src/app/core/services/login/login.service.ts',
    }], cwd);
    expect(exists(cwd, 'src/app/core/services/login/login.service.ts')).toBe(true);
  });

  it('múltiplos moves incrementam report.moved corretamente', () => {
    write('src/app/auth.guard.ts', guard('AuthGuard'));
    write('src/app/jwt.interceptor.ts', interceptor('JwtInterceptor'));
    write('src/app/login.service.ts', service('LoginService'));
    const report = execute([
      { type: 'create_dir', to: 'src/app/core/guards' },
      { type: 'create_dir', to: 'src/app/core/interceptors' },
      { type: 'create_dir', to: 'src/app/core/services/login' },
      { type: 'move', from: 'src/app/auth.guard.ts', to: 'src/app/core/guards/auth.guard.ts' },
      { type: 'move', from: 'src/app/jwt.interceptor.ts', to: 'src/app/core/interceptors/jwt.interceptor.ts' },
      { type: 'move', from: 'src/app/login.service.ts', to: 'src/app/core/services/login/login.service.ts' },
    ], cwd);
    expect(report.moved).toBe(3);
  });
});

// ─── import rewriting ────────────────────────────────────────────────────────

describe('writer › reescrita de imports', () => {
  it('reescreve import relativo simples após move', () => {
    write('src/app/auth.guard.ts', guard('AuthGuard'));
    write('src/app/app.component.ts',
      `import { AuthGuard } from './auth.guard';\n@Component({}) export class AppComponent {}`);

    execute([
      { type: 'create_dir', to: 'src/app/core/guards' },
      { type: 'move', from: 'src/app/auth.guard.ts', to: 'src/app/core/guards/auth.guard.ts' },
    ], cwd);

    const c = readFile(cwd, 'src/app/app.component.ts');
    expect(c).toContain('core/guards/auth.guard');
    expect(c).not.toContain(`'./auth.guard'`);
  });

  it('não altera imports absolutos (não-relativos)', () => {
    write('src/app/auth.guard.ts', guard('AuthGuard'));
    write('src/app/app.component.ts',
      `import { Component } from '@angular/core';\nimport { AuthGuard } from './auth.guard';`);

    execute([
      { type: 'move', from: 'src/app/auth.guard.ts', to: 'src/app/core/guards/auth.guard.ts' },
    ], cwd);

    const c = readFile(cwd, 'src/app/app.component.ts');
    expect(c).toContain(`from '@angular/core'`);
  });

  it('reescreve import em arquivo que foi movido (self-reference)', () => {
    // service importa o guard — ambos são movidos
    write('src/app/auth.guard.ts', guard('AuthGuard'));
    write('src/app/login.service.ts',
      `import { AuthGuard } from './auth.guard';\n${service('LoginService')}`);

    execute([
      { type: 'move', from: 'src/app/auth.guard.ts', to: 'src/app/core/guards/auth.guard.ts' },
      { type: 'move', from: 'src/app/login.service.ts', to: 'src/app/core/services/login/login.service.ts' },
    ], cwd);

    const c = readFile(cwd, 'src/app/core/services/login/login.service.ts');
    expect(c).toContain('auth.guard');
    expect(c).not.toContain(`'./auth.guard'`);
  });

  it('reescreve imports em múltiplos arquivos de uma vez', () => {
    write('src/app/user.model.ts', model('UserModel'));
    write('src/app/auth.service.ts',
      `import { UserModel } from './user.model';\n${service('AuthService')}`);
    write('src/app/user.service.ts',
      `import { UserModel } from './user.model';\n${service('UserService')}`);

    execute([
      { type: 'move', from: 'src/app/user.model.ts', to: 'src/app/core/models/user/user.model.ts' },
    ], cwd);

    const authContent = readFile(cwd, 'src/app/auth.service.ts');
    const userContent = readFile(cwd, 'src/app/user.service.ts');
    expect(authContent).toContain('core/models/user/user.model');
    expect(userContent).toContain('core/models/user/user.model');
  });

  it('não reescreve imports quando nenhum arquivo foi movido', () => {
    const original = `import { Component } from '@angular/core';\n@Component({}) export class AppComponent {}`;
    write('src/app/app.component.ts', original);

    execute([{ type: 'skip', to: 'src/app/app.component.ts' }], cwd);

    expect(readFile(cwd, 'src/app/app.component.ts')).toBe(original);
  });
});

// ─── skip ────────────────────────────────────────────────────────────────────

describe('writer › skip', () => {
  it('skip incrementa report.skipped sem tocar no arquivo', () => {
    const original = service('AuthService');
    write('src/app/core/services/auth/auth.service.ts', original);

    const report = execute([{
      type: 'skip',
      to: 'src/app/core/services/auth/auth.service.ts',
    }], cwd);

    expect(report.skipped).toBe(1);
    expect(readFile(cwd, 'src/app/core/services/auth/auth.service.ts')).toBe(original);
  });
});

// ─── report completo ─────────────────────────────────────────────────────────

describe('writer › report', () => {
  it('report reflete todas as operações corretamente', () => {
    write('src/app/jwt.interceptor.ts', interceptor('JwtInterceptor'));
    write('src/app/core/guards/index.ts', '// existing barrel\n');

    const report = execute([
      { type: 'create_dir', to: 'src/app/core/interceptors' },
      { type: 'move', from: 'src/app/jwt.interceptor.ts', to: 'src/app/core/interceptors/jwt.interceptor.ts' },
      { type: 'create_barrel', to: 'src/app/core/interceptors/index.ts', content: '// barrel\n' },
      { type: 'create_barrel', to: 'src/app/core/guards/index.ts', content: '// barrel\n' }, // já existe
      { type: 'skip', to: 'src/app/app.component.ts' },
    ], cwd);

    expect(report.created).toBe(1);
    expect(report.moved).toBe(1);
    expect(report.barrels).toBe(1);
    expect(report.skipped).toBe(2); // existing barrel + skip
  });
});

// ─── integração end-to-end ───────────────────────────────────────────────────

describe('writer › integração end-to-end', () => {
  it('pipeline completo: classify → plan → execute', () => {
    write('src/app/auth.guard.ts', guard('AuthGuard'));
    write('src/app/jwt.interceptor.ts', interceptor('JwtInterceptor'));
    write('src/app/login.service.ts', service('LoginService', true));
    write('src/app/alarms-list.service.ts', service('AlarmsListService', false));
    write('src/app/user.model.ts', model('UserModel'));

    const files = collectFiles(cwd);
    const plan = buildPlan(files, cwd);
    const report = execute(plan, cwd);

    expect(exists(cwd, 'src/app/core/guards/auth.guard.ts')).toBe(true);
    expect(exists(cwd, 'src/app/core/interceptors/jwt.interceptor.ts')).toBe(true);
    expect(exists(cwd, 'src/app/core/services/login/login.service.ts')).toBe(true);
    expect(exists(cwd, 'src/app/modules/alarms/services/alarms-list.service.ts')).toBe(true);
    expect(exists(cwd, 'src/app/core/models/user/user.model.ts')).toBe(true);
    expect(report.moved).toBeGreaterThanOrEqual(5);
  });

  it('arquivos já no lugar → apenas skips, nenhum move', () => {
    write('src/app/core/guards/auth.guard.ts', guard('AuthGuard'));
    write('src/app/core/interceptors/jwt.interceptor.ts', interceptor('JwtInterceptor'));
    write('src/app/core/services/login/login.service.ts', service('LoginService', true));

    const files = collectFiles(cwd);
    const plan = buildPlan(files, cwd);
    const report = execute(plan, cwd);

    expect(report.moved).toBe(0);
  });

  it('idempotência: executar duas vezes não muda o resultado', () => {
    write('src/app/auth.guard.ts', guard('AuthGuard'));

    const files1 = collectFiles(cwd);
    const plan1 = buildPlan(files1, cwd);
    execute(plan1, cwd);

    // segunda execução — tudo já está no lugar
    const files2 = collectFiles(cwd);
    const plan2 = buildPlan(files2, cwd);
    const report2 = execute(plan2, cwd);

    expect(report2.moved).toBe(0);
    expect(exists(cwd, 'src/app/core/guards/auth.guard.ts')).toBe(true);
  });

  it('pipeline com component page detectado via routing', () => {
    write('src/app/login-routing.module.ts', routing(['LoginComponent']));
    write('src/app/login.component.ts', component('LoginComponent'));
    write('src/app/spinner.component.ts', component('SpinnerComponent'));

    const files = collectFiles(cwd);
    const plan = buildPlan(files, cwd);
    execute(plan, cwd);

    expect(exists(cwd, 'src/app/modules/login/pages/login/login.component.ts')).toBe(true);
    // spinner não é page — vai para components
    expect(exists(cwd, 'src/app/modules/spinner/components/spinner/spinner.component.ts')).toBe(true);
  });

  it('pipe vai para shared/pipes/[name]/', () => {
    write('src/app/currency.pipe.ts', pipe('CurrencyPipe', 'currency'));

    const files = collectFiles(cwd);
    const plan = buildPlan(files, cwd);
    execute(plan, cwd);

    expect(exists(cwd, 'src/app/shared/pipes/currency/currency.pipe.ts')).toBe(true);
  });

  it('normalizer vai para shared/normalizers/[domain]/', () => {
    write('src/app/api.normalizer.ts', normalizer('normalizeApi'));

    const files = collectFiles(cwd);
    const plan = buildPlan(files, cwd);
    execute(plan, cwd);

    expect(exists(cwd, 'src/app/shared/normalizers/api/api.normalizer.ts')).toBe(true);
  });

  it('imports são reescritos corretamente após pipeline completo', () => {
    write('src/app/user.model.ts', model('UserModel'));
    write('src/app/app.component.ts',
      `import { UserModel } from './user.model';\nimport { Component } from '@angular/core';\n@Component({}) export class AppComponent {}`);

    const files = collectFiles(cwd);
    const plan = buildPlan(files, cwd);
    execute(plan, cwd);

    const appContent = readFile(cwd, 'src/app/app.component.ts');
    expect(appContent).toContain('core/models/user/user.model');
    expect(appContent).not.toContain(`'./user.model'`);
    expect(appContent).toContain(`@angular/core`); // import absoluto intocado
  });

  it('projeto totalmente desestruturado: todos os arquivos chegam ao destino certo', () => {
    write('src/app/auth.guard.ts', guard('AuthGuard'));
    write('src/app/jwt.interceptor.ts', interceptor('JwtInterceptor'));
    write('src/app/login.service.ts', service('LoginService', true));
    write('src/app/alarms-list.service.ts', service('AlarmsListService', false));
    write('src/app/login-routing.module.ts', routing(['LoginComponent']));
    write('src/app/login.component.ts', component('LoginComponent'));
    write('src/app/alarm-card.component.ts', component('AlarmCardComponent'));
    write('src/app/user.model.ts', model('UserModel'));
    write('src/app/operator.pipe.ts', pipe('OperatorPipe', 'operator'));

    const files = collectFiles(cwd);
    const plan = buildPlan(files, cwd);
    execute(plan, cwd);

    expect(exists(cwd, 'src/app/core/guards/auth.guard.ts')).toBe(true);
    expect(exists(cwd, 'src/app/core/interceptors/jwt.interceptor.ts')).toBe(true);
    expect(exists(cwd, 'src/app/core/services/login/login.service.ts')).toBe(true);
    expect(exists(cwd, 'src/app/modules/alarms/services/alarms-list.service.ts')).toBe(true);
    expect(exists(cwd, 'src/app/modules/login/pages/login/login.component.ts')).toBe(true);
    expect(exists(cwd, 'src/app/core/models/user/user.model.ts')).toBe(true);
    expect(exists(cwd, 'src/app/shared/pipes/operator/operator.pipe.ts')).toBe(true);

    // fontes não devem existir mais
    expect(exists(cwd, 'src/app/auth.guard.ts')).toBe(false);
    expect(exists(cwd, 'src/app/jwt.interceptor.ts')).toBe(false);
    expect(exists(cwd, 'src/app/login.service.ts')).toBe(false);
  });

  it('arquivos shared não são movidos pelo pipeline', () => {
    write('src/app/shared/components/spinner/spinner.component.ts', component('SpinnerComponent'));
    write('src/app/shared/components/sidebar/services/sidebar.service.ts', service('SidebarService', false));
    write('src/app/shared/components/datagrid/models/datagrid.model.ts', model('DatagridModel'));

    const files = collectFiles(cwd);
    const plan = buildPlan(files, cwd);
    const report = execute(plan, cwd);

    expect(report.moved).toBe(0);
    expect(exists(cwd, 'src/app/shared/components/spinner/spinner.component.ts')).toBe(true);
    expect(exists(cwd, 'src/app/shared/components/sidebar/services/sidebar.service.ts')).toBe(true);
    expect(exists(cwd, 'src/app/shared/components/datagrid/models/datagrid.model.ts')).toBe(true);
  });

  it('barrels são criados para cada pasta de destino com needsBarrel=true', () => {
    write('src/app/auth.guard.ts', guard('AuthGuard'));
    write('src/app/jwt.interceptor.ts', interceptor('JwtInterceptor'));
    write('src/app/login.service.ts', service('LoginService', true));

    const files = collectFiles(cwd);
    const plan = buildPlan(files, cwd);
    execute(plan, cwd);

    expect(exists(cwd, 'src/app/core/guards/index.ts')).toBe(true);
    expect(exists(cwd, 'src/app/core/interceptors/index.ts')).toBe(true);
    expect(exists(cwd, 'src/app/core/services/login/index.ts')).toBe(true);
  });
});
