import { isAngularProject } from '../detector/index.js';
import { collectFiles } from '../classifier/index.js';
import { buildPlan } from '../architect/index.js';
import { logger } from '../logger/index.js';

export function previewCommand(): void {
  const cwd = process.cwd();

  if (!isAngularProject(cwd)) {
    logger.error('angular.json não encontrado. Execute ng-rao dentro da raiz de um projeto Angular.');
    process.exit(1);
  }

  const files = collectFiles(cwd);
  const plan = buildPlan(files, cwd);

  const actionable = plan.filter((a) => a.type !== 'skip');

  if (actionable.length === 0) {
    logger.success('Nada a fazer. Projeto já está conforme o padrão.');
    return;
  }

  logger.log(`Preview — ${actionable.length} ações:`);
  console.log('');

  for (const action of plan) {
    if (action.type === 'create_dir') logger.create(action.to);
    else if (action.type === 'create_barrel') logger.barrel(action.to);
    else if (action.type === 'move') logger.move(action.from!, action.to);
    else logger.skip(action.to);
  }

  console.log('');
  logger.log('Nenhuma alteração feita. Use "ng-rao apply" para aplicar.');
}
