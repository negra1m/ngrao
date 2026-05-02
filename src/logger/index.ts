const PREFIX = '[ng-rao]';

export const logger = {
  log: (msg: string) => console.log(`${PREFIX} ${msg}`),
  success: (msg: string) => console.log(`${PREFIX} ${msg}`),
  warn: (msg: string) => console.warn(`${PREFIX} warn: ${msg}`),
  error: (msg: string) => console.error(`${PREFIX} error: ${msg}`),
  create: (p: string) => console.log(`  [create] ${p}`),
  barrel: (p: string) => console.log(`  [barrel] ${p}`),
  skip: (p: string) => console.log(`  [skip]   ${p}`),
  move: (from: string, to: string) => console.log(`  [move]   ${from} → ${to}`),
};
