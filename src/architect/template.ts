import type { TemplateEntry } from '../types.js';

// Estrutura base que sempre deve existir em qualquer projeto Angular com este padrão
export const TEMPLATE: TemplateEntry[] = [
  { path: 'src/app/core',                  needsBarrel: false },
  { path: 'src/app/core/constants',        needsBarrel: true  },
  { path: 'src/app/core/guards',           needsBarrel: true  },
  { path: 'src/app/core/interceptors',     needsBarrel: true  },
  { path: 'src/app/core/mocks',            needsBarrel: false },
  { path: 'src/app/core/models',           needsBarrel: false },
  { path: 'src/app/core/services',         needsBarrel: false },
  { path: 'src/app/modules',               needsBarrel: false },
  { path: 'src/app/shared',               needsBarrel: false },
  { path: 'src/app/shared/components',     needsBarrel: true  },
  { path: 'src/app/shared/normalizers',    needsBarrel: false },
  { path: 'src/app/shared/pipes',          needsBarrel: true  },
];
