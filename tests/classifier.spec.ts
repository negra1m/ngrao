import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { collectFiles } from '../src/classifier/index.js';
import {
  createProject, destroyProject,
  ANGULAR_JSON, PACKAGE_JSON,
  component, service, guard, interceptor, model, mock, pipe, normalizer, routing,
} from './fixtures.js';

let cwd: string;
beforeEach(() => {
  cwd = createProject([
    { rel: 'angular.json', content: ANGULAR_JSON },
    { rel: 'package.json', content: PACKAGE_JSON },
  ]);
});
afterEach(() => destroyProject(cwd));

// helpers
function add(rel: string, content: string) {
  import('fs').then(fs => {
    import('path').then(path => {
      const full = path.join(cwd, rel);
      fs.mkdirSync(path.dirname(full), { recursive: true });
      fs.writeFileSync(full, content);
    });
  });
}

import fs from 'fs';
import path from 'path';
function write(rel: string, content: string) {
  const full = path.join(cwd, rel);
  fs.mkdirSync(path.dirname(full), { recursive: true });
  fs.writeFileSync(full, content);
}

// ─── kind detection ───────────────────────────────────────────────────────────

describe('classifier › kind detection', () => {
  it('detecta .component.ts', () => {
    write('src/app/login.component.ts', component('LoginComponent'));
    const [f] = collectFiles(cwd);
    expect(f.kind).toBe('component');
  });

  it('detecta .service.ts', () => {
    write('src/app/auth.service.ts', service('AuthService'));
    const [f] = collectFiles(cwd);
    expect(f.kind).toBe('service');
  });

  it('detecta .guard.ts', () => {
    write('src/app/auth.guard.ts', guard('AuthGuard'));
    const [f] = collectFiles(cwd);
    expect(f.kind).toBe('guard');
  });

  it('detecta .interceptor.ts', () => {
    write('src/app/jwt.interceptor.ts', interceptor('JwtInterceptor'));
    const [f] = collectFiles(cwd);
    expect(f.kind).toBe('interceptor');
  });

  it('detecta .model.ts', () => {
    write('src/app/user.model.ts', model('UserModel'));
    const [f] = collectFiles(cwd);
    expect(f.kind).toBe('model');
  });

  it('detecta .mock.ts', () => {
    write('src/app/user.mock.ts', mock('user'));
    const [f] = collectFiles(cwd);
    expect(f.kind).toBe('mock');
  });

  it('detecta .pipe.ts', () => {
    write('src/app/date.pipe.ts', pipe('DatePipe', 'appDate'));
    const [f] = collectFiles(cwd);
    expect(f.kind).toBe('pipe');
  });

  it('detecta .normalizer.ts', () => {
    write('src/app/data.normalizer.ts', normalizer('normalizeData'));
    const [f] = collectFiles(cwd);
    expect(f.kind).toBe('normalizer');
  });
});

// ─── arquivos ignorados ────────────────────────────────────────────────────────

describe('classifier › arquivos ignorados', () => {
  it('ignora index.ts', () => {
    write('src/app/shared/components/index.ts', "export * from './btn';");
    expect(collectFiles(cwd)).toHaveLength(0);
  });

  it('ignora *.spec.ts', () => {
    write('src/app/auth.guard.spec.ts', "describe('x', () => {})");
    expect(collectFiles(cwd)).toHaveLength(0);
  });

  it('ignora *.module.ts', () => {
    write('src/app/app.module.ts', '@NgModule({}) export class AppModule {}');
    expect(collectFiles(cwd)).toHaveLength(0);
  });

  it('ignora *-routing.module.ts', () => {
    write('src/app/app-routing.module.ts', 'const routes = [];');
    expect(collectFiles(cwd)).toHaveLength(0);
  });

  it('ignora arquivos ._* do macOS', () => {
    write('src/app/._app.component.ts', '');
    expect(collectFiles(cwd)).toHaveLength(0);
  });

  it('ignora *.sandbox.ts', () => {
    write('src/app/login.component.sandbox.ts', '');
    expect(collectFiles(cwd)).toHaveLength(0);
  });

  it('retorna array vazio quando src/app não existe', () => {
    expect(collectFiles(cwd)).toHaveLength(0);
  });
});

// ─── scope ────────────────────────────────────────────────────────────────────

describe('classifier › scope', () => {
  it('guard → core sempre', () => {
    write('src/app/auth.guard.ts', guard('AuthGuard'));
    expect(collectFiles(cwd)[0].scope).toBe('core');
  });

  it('interceptor → core sempre', () => {
    write('src/app/jwt.interceptor.ts', interceptor('JwtInterceptor'));
    expect(collectFiles(cwd)[0].scope).toBe('core');
  });

  it('pipe → shared sempre', () => {
    write('src/app/currency.pipe.ts', pipe('CurrencyPipe', 'currency'));
    expect(collectFiles(cwd)[0].scope).toBe('shared');
  });

  it('normalizer → shared sempre', () => {
    write('src/app/api.normalizer.ts', normalizer('normalizeApi'));
    expect(collectFiles(cwd)[0].scope).toBe('shared');
  });

  it('service providedIn root → core', () => {
    write('src/app/login.service.ts', service('LoginService', true));
    expect(collectFiles(cwd)[0].scope).toBe('core');
  });

  it('service sem providedIn → feature', () => {
    write('src/app/alarms-list.service.ts', service('AlarmsListService', false));
    expect(collectFiles(cwd)[0].scope).toBe('feature');
  });

  it('service em shared/ → shared', () => {
    write('src/app/shared/components/sidebar/services/sidebar.service.ts', service('SidebarService', false));
    expect(collectFiles(cwd)[0].scope).toBe('shared');
  });

  it('model fora de shared/ → core', () => {
    write('src/app/user.model.ts', model('UserModel'));
    expect(collectFiles(cwd)[0].scope).toBe('core');
  });

  it('model dentro de shared/ → shared', () => {
    write('src/app/shared/components/datagrid/models/datagrid.model.ts', model('DatagridModel'));
    expect(collectFiles(cwd)[0].scope).toBe('shared');
  });

  it('component em shared/ → shared', () => {
    write('src/app/shared/components/spinner/spinner.component.ts', component('SpinnerComponent'));
    expect(collectFiles(cwd)[0].scope).toBe('shared');
  });

  it('component fora de shared/ → feature', () => {
    write('src/app/modules/login/login.component.ts', component('LoginComponent'));
    expect(collectFiles(cwd)[0].scope).toBe('feature');
  });
});

// ─── domain detection ─────────────────────────────────────────────────────────

describe('classifier › domain detection', () => {
  it('extrai domain do path modules/[feature]/', () => {
    write('src/app/modules/alarms/services/alarms-list.service.ts', service('AlarmsListService', false));
    expect(collectFiles(cwd)[0].domain).toBe('alarms');
  });

  it('extrai domain do path core/services/[domain]/', () => {
    write('src/app/core/services/login/login.service.ts', service('LoginService', true));
    expect(collectFiles(cwd)[0].domain).toBe('login');
  });

  it('fallback: primeiro segmento do nome do arquivo', () => {
    write('src/app/reports-list.service.ts', service('ReportsListService', false));
    expect(collectFiles(cwd)[0].domain).toBe('reports');
  });

  it('domain de arquivo simples (sem hífen)', () => {
    write('src/app/login.service.ts', service('LoginService', true));
    expect(collectFiles(cwd)[0].domain).toBe('login');
  });

  it('domain de guard multi-segmento: primeiro segmento', () => {
    write('src/app/role-access.guard.ts', guard('RoleAccessGuard'));
    expect(collectFiles(cwd)[0].domain).toBe('role');
  });
});

// ─── role detection (page vs component) ──────────────────────────────────────

describe('classifier › role detection', () => {
  it('component referenciado no routing → page', () => {
    write('src/app/login-routing.module.ts', routing(['LoginComponent']));
    write('src/app/login.component.ts', component('LoginComponent'));
    const [f] = collectFiles(cwd);
    expect(f.role).toBe('page');
  });

  it('component não referenciado no routing → component', () => {
    write('src/app/login-field.component.ts', component('LoginFieldComponent'));
    const [f] = collectFiles(cwd);
    expect(f.role).toBe('component');
  });

  it('routing em subpasta é lido corretamente', () => {
    write('src/app/modules/alarms/alarms-routing.module.ts', routing(['AlarmsListComponent']));
    write('src/app/modules/alarms/pages/alarms-list/alarms-list.component.ts', component('AlarmsListComponent'));
    const files = collectFiles(cwd);
    const page = files.find(f => f.filename === 'alarms-list.component.ts');
    expect(page?.role).toBe('page');
  });

  it('múltiplos routing files: todos os components roteáveis detectados', () => {
    write('src/app/modules/alarms/alarms-routing.module.ts', routing(['AlarmsListComponent', 'AlarmsCreationComponent']));
    write('src/app/modules/reports/reports-routing.module.ts', routing(['ReportsListComponent']));
    write('src/app/modules/alarms/pages/alarms-list/alarms-list.component.ts', component('AlarmsListComponent'));
    write('src/app/modules/alarms/pages/alarms-creation/alarms-creation.component.ts', component('AlarmsCreationComponent'));
    write('src/app/modules/reports/pages/reports-list/reports-list.component.ts', component('ReportsListComponent'));
    write('src/app/modules/alarms/components/alarm-card/alarm-card.component.ts', component('AlarmCardComponent'));
    const files = collectFiles(cwd);
    const byName = Object.fromEntries(files.map(f => [f.filename, f.role]));
    expect(byName['alarms-list.component.ts']).toBe('page');
    expect(byName['alarms-creation.component.ts']).toBe('page');
    expect(byName['reports-list.component.ts']).toBe('page');
    expect(byName['alarm-card.component.ts']).toBe('component');
  });

  it('service não tem role', () => {
    write('src/app/login.service.ts', service('LoginService'));
    expect(collectFiles(cwd)[0].role).toBeUndefined();
  });
});

// ─── projeto misto (desorganizado) ───────────────────────────────────────────

describe('classifier › projeto com arquivos misturados', () => {
  it('coleta corretamente quando tudo está na raiz src/app', () => {
    write('src/app/auth.guard.ts', guard('AuthGuard'));
    write('src/app/jwt.interceptor.ts', interceptor('JwtInterceptor'));
    write('src/app/login.service.ts', service('LoginService', true));
    write('src/app/alarms-list.service.ts', service('AlarmsListService', false));
    write('src/app/user.model.ts', model('UserModel'));
    write('src/app/login.component.ts', component('LoginComponent'));
    write('src/app/login-routing.module.ts', routing(['LoginComponent']));
    write('src/app/spinner.component.ts', component('SpinnerComponent'));

    const files = collectFiles(cwd);
    expect(files).toHaveLength(7); // não conta o routing
    expect(files.filter(f => f.kind === 'guard')).toHaveLength(1);
    expect(files.filter(f => f.kind === 'interceptor')).toHaveLength(1);
    expect(files.filter(f => f.kind === 'service')).toHaveLength(2);
    expect(files.filter(f => f.kind === 'model')).toHaveLength(1);
    expect(files.filter(f => f.kind === 'component')).toHaveLength(2);
  });

  it('não inclui arquivos de subpastas node_modules', () => {
    // node_modules não está dentro de src/app, então não é varrido
    const files = collectFiles(cwd);
    expect(files.every(f => !f.relativePath.includes('node_modules'))).toBe(true);
  });
});
