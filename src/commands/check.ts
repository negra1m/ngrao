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

  const moves = plan.filter((a) => a.type === 'move');
  const missingDirs = plan.filter((a) => a.type === 'create_dir');
  const missingBarrels = plan.filter((a) => a.type === 'create_barrel');

  if (moves.length === 0 && missingDirs.length === 0 && missingBarrels.length === 0) {
    logger.success('Projeto conforme o padrão.');
    process.exit(0);
  }

  if (moves.length > 0) {
    logger.warn(`${moves.length} arquivo(s) fora do lugar:`);
    for (const p of moves) {
      console.log(`  ${p.from} → ${p.to}`);
    }
  }

  if (missingDirs.length > 0) {
    logger.warn(`${missingDirs.length} pasta(s) da estrutura base ausente(s):`);
    for (const d of missingDirs) {
      console.log(`  ${d.to}`);
    }
  }

  if (missingBarrels.length > 0) {
    logger.warn(`${missingBarrels.length} barrel(s) ausente(s):`);
    for (const b of missingBarrels) {
      console.log(`  ${b.to}`);
    }
  }

  process.exit(1);
}
