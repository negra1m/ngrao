import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { buildPlan } from '../src/architect/index.js';
import { collectFiles } from '../src/classifier/index.js';
import { execute } from '../src/writer/index.js';
import type { AnalyzedFile, ActionPlan } from '../src/types.js';
import {
  createProject, destroyProject, exists, readFile,
  service, guard, interceptor, model, mock, pipe, normalizer, routing,
  ANGULAR_JSON, PACKAGE_JSON,
} from './fixtures.js';

const CWD = '/tmp/project-ff';

function file(overrides: Partial<AnalyzedFile>): AnalyzedFile {
  return {
    absolutePath: `${CWD}/src/app/fake.ts`,
    relativePath: 'src/app/fake.ts',
    filename: 'fake.ts',
    kind: 'service',
    scope: 'core',
    domain: 'fake',
    ...overrides,
  };
}

// component da feature — presença dele é o que faz a feature existir
function featureComponent(domain: string): AnalyzedFile {
  return file({
    filename: `${domain}.component.ts`,
    relativePath: `src/app/${domain}/${domain}.component.ts`,
    kind: 'component', scope: 'feature', domain, role: 'page',
  });
}

function plan(files: AnalyzedFile[]): ActionPlan {
  return buildPlan(files, CWD, 'feature-first');
}
function movesIn(p: ActionPlan) {
  return p.filter(a => a.type === 'move');
}
function moveTo(p: ActionPlan, from: string): string | undefined {
  return movesIn(p).find(a => a.from === from)?.to;
}

// ─── nada de core/shared/barrels ─────────────────────────────────────────────

describe('feature-first › estrutura base', () => {
  it('não gera nenhuma pasta de template em projeto vazio', () => {
    expect(plan([])).toEqual([]);
  });

  it('nunca gera barrel', () => {
    const p = plan([
      file({ filename: 'auth.guard.ts', relativePath: 'src/app/auth.guard.ts', kind: 'guard', domain: 'auth' }),
      file({ filename: 'token.interceptor.ts', relativePath: 'src/app/token.interceptor.ts', kind: 'interceptor', domain: 'token' }),
      file({ filename: 'operator.pipe.ts', relativePath: 'src/app/operator.pipe.ts', kind: 'pipe', scope: 'shared', domain: 'operator' }),
      featureComponent('alarms'),
    ]);
    expect(p.filter(a => a.type === 'create_barrel')).toEqual([]);
  });

  it('não cria pasta core/ nem shared/', () => {
    const p = plan([featureComponent('alarms')]);
    const dirs = p.filter(a => a.type === 'create_dir').map(a => a.to);
    expect(dirs.some(d => d.startsWith('src/app/core'))).toBe(false);
    expect(dirs.some(d => d.startsWith('src/app/shared'))).toBe(false);
    expect(dirs.some(d => d.startsWith('src/app/modules'))).toBe(false);
  });
});

// ─── globais por tipo ────────────────────────────────────────────────────────

describe('feature-first › globais por tipo', () => {
  it('guard → src/app/guards/', () => {
    const p = plan([file({
      filename: 'auth.guard.ts', relativePath: 'src/app/core/guards/auth.guard.ts',
      kind: 'guard', scope: 'core', domain: 'auth',
    })]);
    expect(moveTo(p, 'src/app/core/guards/auth.guard.ts')).toBe('src/app/guards/auth.guard.ts');
  });

  it('interceptor → src/app/interceptors/', () => {
    const p = plan([file({
      filename: 'token.interceptor.ts', relativePath: 'src/app/core/interceptors/token.interceptor.ts',
      kind: 'interceptor', scope: 'core', domain: 'token',
    })]);
    expect(moveTo(p, 'src/app/core/interceptors/token.interceptor.ts'))
      .toBe('src/app/interceptors/token.interceptor.ts');
  });

  it('pipe → src/app/pipes/ (flat, sempre global)', () => {
    const p = plan([file({
      filename: 'operator.pipe.ts', relativePath: 'src/app/shared/pipes/operator/operator.pipe.ts',
      kind: 'pipe', scope: 'shared', domain: 'operator',
    })]);
    expect(moveTo(p, 'src/app/shared/pipes/operator/operator.pipe.ts'))
      .toBe('src/app/pipes/operator.pipe.ts');
  });

  it('service sem feature correspondente → src/app/services/', () => {
    const p = plan([file({
      filename: 'api.service.ts', relativePath: 'src/app/core/services/api/api.service.ts',
      kind: 'service', scope: 'core', domain: 'api',
    })]);
    expect(moveTo(p, 'src/app/core/services/api/api.service.ts'))
      .toBe('src/app/services/api.service.ts');
  });

  it('model sem feature correspondente → src/app/models/', () => {
    const p = plan([file({
      filename: 'user.model.ts', relativePath: 'src/app/core/models/user/user.model.ts',
      kind: 'model', scope: 'core', domain: 'user',
    })]);
    expect(moveTo(p, 'src/app/core/models/user/user.model.ts'))
      .toBe('src/app/models/user.model.ts');
  });

  it('mock sem feature correspondente → src/app/mocks/', () => {
    const p = plan([file({
      filename: 'user.mock.ts', relativePath: 'src/app/core/mocks/user/user.mock.ts',
      kind: 'mock', scope: 'core', domain: 'user',
    })]);
    expect(moveTo(p, 'src/app/core/mocks/user/user.mock.ts'))
      .toBe('src/app/mocks/user.mock.ts');
  });

  it('normalizer sem feature correspondente → src/app/normalizers/', () => {
    const p = plan([file({
      filename: 'datagrid-content.normalizer.ts',
      relativePath: 'src/app/shared/normalizers/datagrid/datagrid-content.normalizer.ts',
      kind: 'normalizer', scope: 'shared', domain: 'datagrid',
    })]);
    expect(moveTo(p, 'src/app/shared/normalizers/datagrid/datagrid-content.normalizer.ts'))
      .toBe('src/app/normalizers/datagrid-content.normalizer.ts');
  });
});

// ─── co-location por feature ─────────────────────────────────────────────────

describe('feature-first › co-location por feature', () => {
  it('page roteável → raiz da feature', () => {
    const p = plan([file({
      filename: 'alarms.component.ts',
      relativePath: 'src/app/modules/alarms/pages/alarms/alarms.component.ts',
      kind: 'component', scope: 'feature', domain: 'alarms', role: 'page',
    })]);
    expect(moveTo(p, 'src/app/modules/alarms/pages/alarms/alarms.component.ts'))
      .toBe('src/app/alarms/alarms.component.ts');
  });

  it('component não-roteável homônimo da feature → raiz da feature (sem home/home/)', () => {
    const p = plan([file({
      filename: 'home.component.ts',
      relativePath: 'src/app/modules/home/pages/home/home.component.ts',
      kind: 'component', scope: 'feature', domain: 'home', role: 'component',
    })]);
    expect(moveTo(p, 'src/app/modules/home/pages/home/home.component.ts'))
      .toBe('src/app/home/home.component.ts');
  });

  it('component não-roteável → [feature]/[nome]/', () => {
    const p = plan([file({
      filename: 'alarm-card.component.ts',
      relativePath: 'src/app/modules/alarms/components/alarm-card/alarm-card.component.ts',
      kind: 'component', scope: 'feature', domain: 'alarms', role: 'component',
    })]);
    expect(moveTo(p, 'src/app/modules/alarms/components/alarm-card/alarm-card.component.ts'))
      .toBe('src/app/alarms/alarm-card/alarm-card.component.ts');
  });

  it("service providedIn: 'root' com feature dona → dentro da feature", () => {
    const p = plan([
      featureComponent('alarms'),
      file({
        filename: 'alarms.service.ts', relativePath: 'src/app/core/services/alarms/alarms.service.ts',
        kind: 'service', scope: 'core', domain: 'alarms',
      }),
    ]);
    expect(moveTo(p, 'src/app/core/services/alarms/alarms.service.ts'))
      .toBe('src/app/alarms/alarms.service.ts');
  });

  it('model com feature dona → dentro da feature', () => {
    const p = plan([
      featureComponent('alarms'),
      file({
        filename: 'alarms.model.ts', relativePath: 'src/app/core/models/alarms/alarms.model.ts',
        kind: 'model', scope: 'core', domain: 'alarms',
      }),
    ]);
    expect(moveTo(p, 'src/app/core/models/alarms/alarms.model.ts'))
      .toBe('src/app/alarms/alarms.model.ts');
  });

  it('normalizer com feature dona → dentro da feature', () => {
    const p = plan([
      featureComponent('alarms'),
      file({
        filename: 'alarms-content.normalizer.ts',
        relativePath: 'src/app/shared/normalizers/alarms/alarms-content.normalizer.ts',
        kind: 'normalizer', scope: 'shared', domain: 'alarms',
      }),
    ]);
    expect(moveTo(p, 'src/app/shared/normalizers/alarms/alarms-content.normalizer.ts'))
      .toBe('src/app/alarms/alarms-content.normalizer.ts');
  });
});

// ─── ex-shared ───────────────────────────────────────────────────────────────

describe('feature-first › ex-shared', () => {
  it('shared/components/[x] → components/[x]', () => {
    const p = plan([file({
      filename: 'search-box.component.ts',
      relativePath: 'src/app/shared/components/search-box/search-box.component.ts',
      kind: 'component', scope: 'shared', domain: 'search', role: 'component',
    })]);
    expect(moveTo(p, 'src/app/shared/components/search-box/search-box.component.ts'))
      .toBe('src/app/components/search-box/search-box.component.ts');
  });

  it('preserva a subestrutura do component shared (models/, services/)', () => {
    const p = plan([
      file({
        filename: 'search.model.ts',
        relativePath: 'src/app/shared/components/search-box/models/search.model.ts',
        kind: 'model', scope: 'shared', domain: 'search',
      }),
      file({
        filename: 'search.service.ts',
        relativePath: 'src/app/shared/components/search-box/services/search.service.ts',
        kind: 'service', scope: 'shared', domain: 'search',
      }),
    ]);
    expect(moveTo(p, 'src/app/shared/components/search-box/models/search.model.ts'))
      .toBe('src/app/components/search-box/models/search.model.ts');
    expect(moveTo(p, 'src/app/shared/components/search-box/services/search.service.ts'))
      .toBe('src/app/components/search-box/services/search.service.ts');
  });

  it('component shared fora de shared/components → components/[nome]', () => {
    const p = plan([file({
      filename: 'search-box.component.ts',
      relativePath: 'src/app/shared/search-box.component.ts',
      kind: 'component', scope: 'shared', domain: 'search', role: 'component',
    })]);
    expect(moveTo(p, 'src/app/shared/search-box.component.ts'))
      .toBe('src/app/components/search-box/search-box.component.ts');
  });

  it('arquivo já em src/app/components/ não é movido', () => {
    const p = plan([file({
      filename: 'search-box.component.ts',
      relativePath: 'src/app/components/search-box/search-box.component.ts',
      kind: 'component', scope: 'feature', domain: 'components', role: 'component',
    })]);
    expect(p).toEqual([]);
  });
});

// ─── arquivos intocados ──────────────────────────────────────────────────────

describe('feature-first › arquivos intocados', () => {
  it('app.component.ts não é movido', () => {
    const p = plan([file({
      filename: 'app.component.ts', relativePath: 'src/app/app.component.ts',
      kind: 'component', scope: 'feature', domain: 'app', role: 'component',
    })]);
    expect(p).toEqual([]);
  });

  it('sub-components/ não é movido', () => {
    const p = plan([file({
      filename: 'row.component.ts',
      relativePath: 'src/app/alarms/alarm-card/sub-components/row.component.ts',
      kind: 'component', scope: 'feature', domain: 'alarms', role: 'component',
    })]);
    expect(p).toEqual([]);
  });

  it('arquivo já no destino final vira skip', () => {
    const p = plan([file({
      filename: 'auth.guard.ts', relativePath: 'src/app/guards/auth.guard.ts',
      kind: 'guard', scope: 'core', domain: 'auth',
    })]);
    expect(p).toEqual([{ type: 'skip', to: 'src/app/guards/auth.guard.ts' }]);
  });
});

// ─── integração: projeto real no disco ───────────────────────────────────────

describe('feature-first › migração completa', () => {
  let cwd: string;

  beforeEach(() => {
    cwd = createProject([
      { rel: 'angular.json', content: ANGULAR_JSON },
      { rel: 'package.json', content: PACKAGE_JSON },
      { rel: 'src/app/app.component.ts', content: 'export class AppComponent {}' },
      { rel: 'src/app/app.routes.ts', content: routing(['AlarmsComponent', 'LoginComponent']) },
      { rel: 'src/app/core/guards/auth.guard.ts', content: guard('AuthGuard') },
      { rel: 'src/app/core/interceptors/token.interceptor.ts', content: interceptor('TokenInterceptor') },
      { rel: 'src/app/core/services/api/api.service.ts', content: service('ApiService') },
      { rel: 'src/app/core/services/alarms/alarms.service.ts', content: service('AlarmsService') },
      { rel: 'src/app/core/models/alarms/alarms.model.ts', content: model('Alarm') },
      { rel: 'src/app/core/mocks/user/user.mock.ts', content: mock('User') },
      {
        rel: 'src/app/modules/alarms/pages/alarms/alarms.component.ts',
        content: `
import { Component } from '@angular/core';
import { AlarmsService } from '../../../../core/services/alarms/alarms.service';
@Component({ selector: 'app-alarms', templateUrl: './alarms.component.html' })
export class AlarmsComponent { constructor(private s: AlarmsService) {} }
`,
      },
      { rel: 'src/app/modules/alarms/pages/alarms/alarms.component.html', content: '<div></div>' },
      {
        rel: 'src/app/modules/alarms/components/alarm-card/alarm-card.component.ts',
        content: `
import { Component } from '@angular/core';
@Component({ selector: 'app-alarm-card', template: '' })
export class AlarmCardComponent {}
`,
      },
      {
        rel: 'src/app/modules/login/pages/login/login.component.ts',
        content: `
import { Component } from '@angular/core';
@Component({ selector: 'app-login', template: '' })
export class LoginComponent {}
`,
      },
      {
        rel: 'src/app/shared/components/search-box/search-box.component.ts',
        content: `
import { Component } from '@angular/core';
@Component({ selector: 'app-search-box', template: '' })
export class SearchBoxComponent {}
`,
      },
      { rel: 'src/app/shared/components/search-box/models/search.model.ts', content: model('Search') },
      { rel: 'src/app/shared/pipes/operator/operator.pipe.ts', content: pipe('OperatorPipe', 'operator') },
      { rel: 'src/app/shared/normalizers/grid/grid-content.normalizer.ts', content: normalizer('normalizeGrid') },
    ]);

    const files = collectFiles(cwd, 'feature-first');
    execute(buildPlan(files, cwd, 'feature-first'), cwd, { pruneEmptyDirs: true });
  });

  afterEach(() => destroyProject(cwd));

  it('coloca cada arquivo no destino feature-first', () => {
    expect(exists(cwd, 'src/app/guards/auth.guard.ts')).toBe(true);
    expect(exists(cwd, 'src/app/interceptors/token.interceptor.ts')).toBe(true);
    expect(exists(cwd, 'src/app/services/api.service.ts')).toBe(true);
    expect(exists(cwd, 'src/app/mocks/user.mock.ts')).toBe(true);
    expect(exists(cwd, 'src/app/pipes/operator.pipe.ts')).toBe(true);
    expect(exists(cwd, 'src/app/normalizers/grid-content.normalizer.ts')).toBe(true);
    expect(exists(cwd, 'src/app/alarms/alarms.component.ts')).toBe(true);
    expect(exists(cwd, 'src/app/alarms/alarms.service.ts')).toBe(true);
    expect(exists(cwd, 'src/app/alarms/alarms.model.ts')).toBe(true);
    expect(exists(cwd, 'src/app/alarms/alarm-card/alarm-card.component.ts')).toBe(true);
    expect(exists(cwd, 'src/app/login/login.component.ts')).toBe(true);
    expect(exists(cwd, 'src/app/components/search-box/search-box.component.ts')).toBe(true);
    expect(exists(cwd, 'src/app/components/search-box/models/search.model.ts')).toBe(true);
  });

  it('leva o template junto com o component', () => {
    expect(exists(cwd, 'src/app/alarms/alarms.component.html')).toBe(true);
  });

  it('não deixa core/, shared/ nem modules/ para trás', () => {
    expect(exists(cwd, 'src/app/core')).toBe(false);
    expect(exists(cwd, 'src/app/shared')).toBe(false);
    expect(exists(cwd, 'src/app/modules')).toBe(false);
  });

  it('não cria nenhum barrel', () => {
    expect(exists(cwd, 'src/app/guards/index.ts')).toBe(false);
    expect(exists(cwd, 'src/app/pipes/index.ts')).toBe(false);
    expect(exists(cwd, 'src/app/alarms/index.ts')).toBe(false);
  });

  it('mantém app.component.ts na raiz', () => {
    expect(exists(cwd, 'src/app/app.component.ts')).toBe(true);
  });

  it('reescreve os imports afetados', () => {
    const content = readFile(cwd, 'src/app/alarms/alarms.component.ts');
    expect(content).toContain("from './alarms.service'");
    expect(content).toContain("templateUrl: './alarms.component.html'");
  });

  it('é idempotente — segunda passada não move nada', () => {
    const files = collectFiles(cwd, 'feature-first');
    const p = buildPlan(files, cwd, 'feature-first');
    expect(p.filter(a => a.type === 'move')).toEqual([]);
    expect(p.filter(a => a.type === 'create_dir')).toEqual([]);
  });
});

// ─── path alias ──────────────────────────────────────────────────────────────

describe('feature-first › path alias', () => {
  let cwd: string;

  beforeEach(() => {
    cwd = createProject([
      { rel: 'angular.json', content: ANGULAR_JSON },
      { rel: 'package.json', content: PACKAGE_JSON },
      {
        rel: 'tsconfig.json',
        content: JSON.stringify({
          compilerOptions: { paths: { '@core/*': ['src/app/core/*'] } },
        }),
      },
      { rel: 'src/app/core/guards/auth.guard.ts', content: guard('AuthGuard') },
    ]);
  });

  afterEach(() => destroyProject(cwd));

  it('move arquivos cobertos por alias', () => {
    const p = buildPlan(collectFiles(cwd, 'feature-first'), cwd, 'feature-first');
    expect(moveTo(p, 'src/app/core/guards/auth.guard.ts')).toBe('src/app/guards/auth.guard.ts');
  });

  it('modo clássico continua respeitando o alias', () => {
    const p = buildPlan(collectFiles(cwd), cwd);
    expect(moveTo(p, 'src/app/core/guards/auth.guard.ts')).toBeUndefined();
  });
});
