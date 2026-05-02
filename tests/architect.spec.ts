import { describe, it, expect } from 'vitest';
import { buildPlan } from '../src/architect/index.js';
import { TEMPLATE } from '../src/architect/template.js';
import type { AnalyzedFile, ActionPlan } from '../src/types.js';

const CWD = '/tmp/project';

function file(overrides: Partial<AnalyzedFile>): AnalyzedFile {
  return {
    absolutePath: '/tmp/project/src/app/fake.ts',
    relativePath: 'src/app/fake.ts',
    filename: 'fake.ts',
    kind: 'service',
    scope: 'core',
    domain: 'fake',
    ...overrides,
  };
}

function movesIn(plan: ActionPlan) {
  return plan.filter(a => a.type === 'move');
}
function skipsIn(plan: ActionPlan) {
  return plan.filter(a => a.type === 'skip');
}
function barrelsIn(plan: ActionPlan) {
  return plan.filter(a => a.type === 'create_barrel');
}
function dirsIn(plan: ActionPlan) {
  return plan.filter(a => a.type === 'create_dir');
}

// ─── estrutura base ───────────────────────────────────────────────────────────

describe('architect › estrutura base (template)', () => {
  it('gera create_dir para todas as pastas do template', () => {
    const plan = buildPlan([], CWD);
    const dirs = dirsIn(plan).map(a => a.to);
    for (const entry of TEMPLATE) {
      expect(dirs).toContain(entry.path);
    }
  });

  it('gera barrels para pastas marcadas como needsBarrel', () => {
    const plan = buildPlan([], CWD);
    const barrels = barrelsIn(plan).map(a => a.to);
    for (const entry of TEMPLATE.filter(e => e.needsBarrel)) {
      expect(barrels).toContain(`${entry.path}/index.ts`);
    }
  });

  it('barrel content tem comentário de uso', () => {
    const plan = buildPlan([], CWD);
    for (const barrel of barrelsIn(plan)) {
      expect(barrel.content).toContain('barrel');
      expect(barrel.content).toContain('export');
      expect(barrel.content).toContain('./');
    }
  });

  it('não gera barrel para pastas com needsBarrel: false', () => {
    const plan = buildPlan([], CWD);
    const barrelPaths = barrelsIn(plan).map(a => a.to);
    // src/app/core não tem needsBarrel
    expect(barrelPaths).not.toContain('src/app/core/index.ts');
    expect(barrelPaths).not.toContain('src/app/modules/index.ts');
  });
});

// ─── moves: guards ────────────────────────────────────────────────────────────

describe('architect › moves: guards', () => {
  it('move guard da raiz → core/guards/', () => {
    const plan = buildPlan([file({
      filename: 'auth.guard.ts',
      relativePath: 'src/app/auth.guard.ts',
      kind: 'guard', scope: 'core', domain: 'auth',
    })], CWD);
    const m = movesIn(plan).find(a => a.from === 'src/app/auth.guard.ts');
    expect(m?.to).toBe('src/app/core/guards/auth.guard.ts');
  });

  it('gera barrel para core/guards ao mover guard', () => {
    const plan = buildPlan([file({
      filename: 'auth.guard.ts',
      relativePath: 'src/app/auth.guard.ts',
      kind: 'guard', scope: 'core', domain: 'auth',
    })], CWD);
    expect(barrelsIn(plan).map(b => b.to)).toContain('src/app/core/guards/index.ts');
  });

  it('skip quando guard já está em core/guards/', () => {
    const plan = buildPlan([file({
      filename: 'auth.guard.ts',
      relativePath: 'src/app/core/guards/auth.guard.ts',
      kind: 'guard', scope: 'core', domain: 'auth',
    })], CWD);
    expect(movesIn(plan).find(a => a.from?.includes('auth.guard'))).toBeUndefined();
    expect(skipsIn(plan).find(a => a.to === 'src/app/core/guards/auth.guard.ts')).toBeDefined();
  });
});

// ─── moves: interceptors ──────────────────────────────────────────────────────

describe('architect › moves: interceptors', () => {
  it('move interceptor → core/interceptors/', () => {
    const plan = buildPlan([file({
      filename: 'jwt.interceptor.ts',
      relativePath: 'src/app/jwt.interceptor.ts',
      kind: 'interceptor', scope: 'core', domain: 'jwt',
    })], CWD);
    expect(movesIn(plan)[0]?.to).toBe('src/app/core/interceptors/jwt.interceptor.ts');
  });

  it('múltiplos interceptors geram barrel uma só vez', () => {
    const plan = buildPlan([
      file({ filename: 'jwt.interceptor.ts', relativePath: 'src/app/jwt.interceptor.ts', kind: 'interceptor', scope: 'core', domain: 'jwt' }),
      file({ filename: 'error.interceptor.ts', relativePath: 'src/app/error.interceptor.ts', kind: 'interceptor', scope: 'core', domain: 'error' }),
    ], CWD);
    const barrels = barrelsIn(plan).filter(b => b.to === 'src/app/core/interceptors/index.ts');
    expect(barrels).toHaveLength(1);
  });
});

// ─── moves: services ──────────────────────────────────────────────────────────

describe('architect › moves: services', () => {
  it('service root → core/services/[domain]/', () => {
    const plan = buildPlan([file({
      filename: 'login.service.ts',
      relativePath: 'src/app/login.service.ts',
      kind: 'service', scope: 'core', domain: 'login',
    })], CWD);
    expect(movesIn(plan)[0]?.to).toBe('src/app/core/services/login/login.service.ts');
  });

  it('service feature → modules/[domain]/services/', () => {
    const plan = buildPlan([file({
      filename: 'alarms-list.service.ts',
      relativePath: 'src/app/alarms-list.service.ts',
      kind: 'service', scope: 'feature', domain: 'alarms',
    })], CWD);
    expect(movesIn(plan)[0]?.to).toBe('src/app/modules/alarms/services/alarms-list.service.ts');
  });

  it('dois services do mesmo domain geram barrel uma só vez', () => {
    const plan = buildPlan([
      file({ filename: 'alarms-list.service.ts', relativePath: 'src/app/alarms-list.service.ts', kind: 'service', scope: 'feature', domain: 'alarms' }),
      file({ filename: 'alarms-creation.service.ts', relativePath: 'src/app/alarms-creation.service.ts', kind: 'service', scope: 'feature', domain: 'alarms' }),
    ], CWD);
    const barrels = barrelsIn(plan).filter(b => b.to === 'src/app/modules/alarms/services/index.ts');
    expect(barrels).toHaveLength(1);
  });

  it('service shared não é movido', () => {
    const plan = buildPlan([file({
      filename: 'sidebar.service.ts',
      relativePath: 'src/app/shared/components/sidebar/services/sidebar.service.ts',
      kind: 'service', scope: 'shared', domain: 'sidebar',
    })], CWD);
    expect(movesIn(plan).find(a => a.from?.includes('sidebar.service'))).toBeUndefined();
  });
});

// ─── moves: components ────────────────────────────────────────────────────────

describe('architect › moves: components', () => {
  it('component page → modules/[domain]/pages/[name]/', () => {
    const plan = buildPlan([file({
      filename: 'login.component.ts',
      relativePath: 'src/app/login.component.ts',
      kind: 'component', scope: 'feature', domain: 'login', role: 'page',
    })], CWD);
    expect(movesIn(plan)[0]?.to).toBe('src/app/modules/login/pages/login/login.component.ts');
  });

  it('component não-page → modules/[domain]/components/[name]/', () => {
    const plan = buildPlan([file({
      filename: 'alarm-card.component.ts',
      relativePath: 'src/app/alarm-card.component.ts',
      kind: 'component', scope: 'feature', domain: 'alarm', role: 'component',
    })], CWD);
    expect(movesIn(plan)[0]?.to).toBe('src/app/modules/alarm/components/alarm-card/alarm-card.component.ts');
  });

  it('component shared não é movido', () => {
    const plan = buildPlan([file({
      filename: 'spinner.component.ts',
      relativePath: 'src/app/shared/components/spinner/spinner.component.ts',
      kind: 'component', scope: 'shared', domain: 'spinner', role: 'component',
    })], CWD);
    expect(movesIn(plan).find(a => a.from?.includes('spinner'))).toBeUndefined();
  });

  it('component em sub-components/ não é movido', () => {
    const plan = buildPlan([file({
      filename: 'card-item.component.ts',
      relativePath: 'src/app/shared/components/card/sub-components/card-item/card-item.component.ts',
      kind: 'component', scope: 'shared', domain: 'card', role: 'component',
    })], CWD);
    expect(movesIn(plan).find(a => a.from?.includes('card-item'))).toBeUndefined();
  });

  it('app.component.ts não é movido', () => {
    const plan = buildPlan([file({
      filename: 'app.component.ts',
      relativePath: 'src/app/app.component.ts',
      kind: 'component', scope: 'feature', domain: 'app', role: 'component',
    })], CWD);
    expect(movesIn(plan).find(a => a.from?.includes('app.component'))).toBeUndefined();
  });
});

// ─── moves: models e mocks ────────────────────────────────────────────────────

describe('architect › moves: models e mocks', () => {
  it('model global → core/models/[domain]/', () => {
    const plan = buildPlan([file({
      filename: 'user.model.ts',
      relativePath: 'src/app/user.model.ts',
      kind: 'model', scope: 'core', domain: 'user',
    })], CWD);
    expect(movesIn(plan)[0]?.to).toBe('src/app/core/models/user/user.model.ts');
  });

  it('mock global → core/mocks/[domain]/', () => {
    const plan = buildPlan([file({
      filename: 'user.mock.ts',
      relativePath: 'src/app/user.mock.ts',
      kind: 'mock', scope: 'core', domain: 'user',
    })], CWD);
    expect(movesIn(plan)[0]?.to).toBe('src/app/core/mocks/user/user.mock.ts');
  });

  it('model shared não é movido', () => {
    const plan = buildPlan([file({
      filename: 'datagrid.model.ts',
      relativePath: 'src/app/shared/components/datagrid/models/datagrid.model.ts',
      kind: 'model', scope: 'shared', domain: 'datagrid',
    })], CWD);
    expect(movesIn(plan).find(a => a.from?.includes('datagrid.model'))).toBeUndefined();
  });
});

// ─── moves: pipes e normalizers ──────────────────────────────────────────────

describe('architect › moves: pipes e normalizers', () => {
  it('pipe → shared/pipes/[name]/', () => {
    const plan = buildPlan([file({
      filename: 'operator.pipe.ts',
      relativePath: 'src/app/operator.pipe.ts',
      kind: 'pipe', scope: 'shared', domain: 'operator',
    })], CWD);
    expect(movesIn(plan)[0]?.to).toBe('src/app/shared/pipes/operator/operator.pipe.ts');
  });

  it('normalizer → shared/normalizers/[domain]/', () => {
    const plan = buildPlan([file({
      filename: 'datagrid-content.normalizer.ts',
      relativePath: 'src/app/datagrid-content.normalizer.ts',
      kind: 'normalizer', scope: 'shared', domain: 'datagrid',
    })], CWD);
    expect(movesIn(plan)[0]?.to).toBe('src/app/shared/normalizers/datagrid/datagrid-content.normalizer.ts');
  });
});

// ─── plano completo ───────────────────────────────────────────────────────────

describe('architect › plano completo', () => {
  it('projeto totalmente desorganizado gera plano coerente', () => {
    const files: AnalyzedFile[] = [
      file({ filename: 'auth.guard.ts', relativePath: 'src/app/auth.guard.ts', kind: 'guard', scope: 'core', domain: 'auth' }),
      file({ filename: 'jwt.interceptor.ts', relativePath: 'src/app/jwt.interceptor.ts', kind: 'interceptor', scope: 'core', domain: 'jwt' }),
      file({ filename: 'login.service.ts', relativePath: 'src/app/login.service.ts', kind: 'service', scope: 'core', domain: 'login' }),
      file({ filename: 'alarms-list.service.ts', relativePath: 'src/app/alarms-list.service.ts', kind: 'service', scope: 'feature', domain: 'alarms' }),
      file({ filename: 'login.component.ts', relativePath: 'src/app/login.component.ts', kind: 'component', scope: 'feature', domain: 'login', role: 'page' }),
      file({ filename: 'alarm-card.component.ts', relativePath: 'src/app/alarm-card.component.ts', kind: 'component', scope: 'feature', domain: 'alarm', role: 'component' }),
      file({ filename: 'user.model.ts', relativePath: 'src/app/user.model.ts', kind: 'model', scope: 'core', domain: 'user' }),
      file({ filename: 'operator.pipe.ts', relativePath: 'src/app/operator.pipe.ts', kind: 'pipe', scope: 'shared', domain: 'operator' }),
    ];

    const plan = buildPlan(files, CWD);
    const moves = movesIn(plan);

    expect(moves.find(m => m.from === 'src/app/auth.guard.ts')?.to).toBe('src/app/core/guards/auth.guard.ts');
    expect(moves.find(m => m.from === 'src/app/jwt.interceptor.ts')?.to).toBe('src/app/core/interceptors/jwt.interceptor.ts');
    expect(moves.find(m => m.from === 'src/app/login.service.ts')?.to).toBe('src/app/core/services/login/login.service.ts');
    expect(moves.find(m => m.from === 'src/app/alarms-list.service.ts')?.to).toBe('src/app/modules/alarms/services/alarms-list.service.ts');
    expect(moves.find(m => m.from === 'src/app/login.component.ts')?.to).toBe('src/app/modules/login/pages/login/login.component.ts');
    expect(moves.find(m => m.from === 'src/app/alarm-card.component.ts')?.to).toBe('src/app/modules/alarm/components/alarm-card/alarm-card.component.ts');
    expect(moves.find(m => m.from === 'src/app/user.model.ts')?.to).toBe('src/app/core/models/user/user.model.ts');
    expect(moves.find(m => m.from === 'src/app/operator.pipe.ts')?.to).toBe('src/app/shared/pipes/operator/operator.pipe.ts');
  });

  it('projeto já organizado → apenas skips (nenhum move)', () => {
    const files: AnalyzedFile[] = [
      file({ filename: 'auth.guard.ts', relativePath: 'src/app/core/guards/auth.guard.ts', kind: 'guard', scope: 'core', domain: 'auth' }),
      file({ filename: 'login.service.ts', relativePath: 'src/app/core/services/login/login.service.ts', kind: 'service', scope: 'core', domain: 'login' }),
    ];
    const plan = buildPlan(files, CWD);
    expect(movesIn(plan)).toHaveLength(0);
  });
});
