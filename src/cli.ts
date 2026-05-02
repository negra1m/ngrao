import { Command } from 'commander';
import { applyCommand } from './commands/apply.js';
import { checkCommand } from './commands/check.js';
import { previewCommand } from './commands/preview.js';
import { barrelCommand } from './commands/barrel.js';

export const program = new Command();

program
  .name('ngrao')
  .description('Angular Rewriter Architecture Orchestrator — applies standard folder structure to Angular 19+ projects')
  .version('1.0.0');

program
  .command('apply')
  .description('Apply the standard architecture to the current Angular project')
  .option('-y, --yes', 'Skip confirmation prompt')
  .action(applyCommand);

program
  .command('check')
  .description('Check if the project conforms to the standard architecture (no changes made)')
  .action(checkCommand);

program
  .command('preview')
  .alias('dry-run')
  .description('Preview what would be created without making any changes')
  .action(previewCommand);

program
  .command('barrel [path]')
  .description('Generate or update index.ts barrel for a specific folder')
  .action(barrelCommand);
