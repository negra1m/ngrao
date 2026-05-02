import readline from 'readline';
import { isAngularProject } from '../detector/index.js';
import { collectFiles } from '../classifier/index.js';
import { buildPlan } from '../architect/index.js';
import { execute } from '../writer/index.js';
import { logger } from '../logger/index.js';

interface ApplyOptions {
  yes?: boolean;
}

export async function applyCommand(options: ApplyOptions): Promise<void> {
  const cwd = process.cwd();

  if (!isAngularProject(cwd)) {
    logger.error('angular.json não encontrado. Execute ng-rao dentro da raiz de um projeto Angular.');
    process.exit(1);
  }

  const files = collectFiles(cwd);
  const plan = buildPlan(files, cwd);

  const actionable = plan.filter((a) => a.type !== 'skip');

  if (actionable.length === 0) {
    logger.success('Projeto já está conforme o padrão. Nada a fazer.');
    return;
  }

  const moves = actionable.filter((a) => a.type === 'move').length;
  const creates = actionable.filter((a) => a.type === 'create_dir').length;
  const barrels = actionable.filter((a) => a.type === 'create_barrel').length;

  logger.log(`${moves} moves, ${creates} pastas a criar, ${barrels} barrels a gerar.`);

  if (!options.yes) {
    const confirmed = await confirm('Aplicar? (Enter para confirmar, Ctrl+C para cancelar) ');
    if (!confirmed) {
      logger.log('Cancelado.');
      return;
    }
  }

  const report = execute(plan, cwd);

  console.log('');
  logger.success(
    `Pronto. ${report.moved} arquivos movidos, ${report.created} pastas criadas, ${report.barrels} barrels gerados, ${report.skipped} ignorados.`
  );
}

function confirm(question: string): Promise<boolean> {
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    rl.question(question, () => {
      rl.close();
      resolve(true);
    });
  });
}
