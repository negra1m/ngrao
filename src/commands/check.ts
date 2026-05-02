import { isAngularProject } from '../detector/index.js';
import { collectFiles } from '../classifier/index.js';
import { buildPlan } from '../architect/index.js';
import { logger } from '../logger/index.js';

export function checkCommand(): void {
  const cwd = process.cwd();

  if (!isAngularProject(cwd)) {
    logger.error('angular.json não encontrado. Execute ng-rao dentro da raiz de um projeto Angular.');
    process.exit(1);
  }

  const files = collectFiles(cwd);
  const plan = buildPlan(files, cwd);

  const problems = plan.filter((a) => a.type === 'move');

  if (problems.length === 0) {
    logger.success('Projeto conforme o padrão.');
    process.exit(0);
  }

  logger.warn(`${problems.length} arquivo(s) fora do lugar:`);
  for (const p of problems) {
    console.log(`  ${p.from} → ${p.to}`);
  }
  process.exit(1);
}
