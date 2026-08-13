import readline from 'readline';
import { spawnSync } from 'child_process';
import { isAngularProject } from '../detector/index.js';
import { collectFiles } from '../classifier/index.js';
import { buildPlan } from '../architect/index.js';
import { execute } from '../writer/index.js';
import { logger } from '../logger/index.js';
import { resolveMode, type LayoutOptions } from './options.js';

interface ApplyOptions extends LayoutOptions {
  yes?: boolean;
}

export async function applyCommand(options: ApplyOptions): Promise<void> {
  const cwd = process.cwd();

  if (!isAngularProject(cwd)) {
    logger.error('angular.json não encontrado. Execute ng-rao dentro da raiz de um projeto Angular.');
    process.exit(1);
  }

  const mode = resolveMode(options);
  if (mode === 'feature-first') {
    logger.log('modo feature-first — core/ e shared/ serão desmontados.');
  }

  const files = collectFiles(cwd, mode);
  const plan = buildPlan(files, cwd, mode);

  const actionable = plan.filter((a) => a.type !== 'skip');

  if (actionable.length === 0) {
    logger.success('Projeto já está conforme o padrão. Nada a fazer.');
    return;
  }

  const moves = actionable.filter((a) => a.type === 'move').length;
  const creates = actionable.filter((a) => a.type === 'create_dir').length;
  const barrels = actionable.filter((a) => a.type === 'create_barrel').length;

  logger.log(`${moves} moves, ${creates} pastas a criar, ${barrels} barrels a gerar.`);

  if (hasUncommittedChanges(cwd)) {
    logger.warn('working tree do git com alterações não commitadas — recomendado commitar antes de aplicar.');
  }

  if (!options.yes) {
    const confirmed = await confirm('Aplicar? (Enter/s para confirmar, n para cancelar) ');
    if (!confirmed) {
      logger.log('Cancelado.');
      return;
    }
  }

  const report = execute(plan, cwd, { pruneEmptyDirs: mode === 'feature-first' });

  console.log('');
  logger.success(
    `Pronto. ${report.moved} arquivos movidos, ${report.created} pastas criadas, ${report.barrels} barrels gerados, ${report.skipped} ignorados.`
  );
  if (report.pruned > 0) {
    logger.log(`${report.pruned} pasta(s) vazia(s) removida(s).`);
  }
}

// Enter, y/yes, s/sim confirmam; qualquer outra resposta cancela
export function isConfirmation(answer: string): boolean {
  const a = answer.trim().toLowerCase();
  return a === '' || a === 'y' || a === 'yes' || a === 's' || a === 'sim';
}

function hasUncommittedChanges(cwd: string): boolean {
  try {
    const result = spawnSync('git', ['status', '--porcelain'], { cwd, encoding: 'utf-8' });
    return result.status === 0 && result.stdout.trim().length > 0;
  } catch {
    return false;
  }
}

function confirm(question: string): Promise<boolean> {
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    rl.question(question, (answer) => {
      rl.close();
      resolve(isConfirmation(answer));
    });
  });
}
