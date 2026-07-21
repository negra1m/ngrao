import { Command } from 'commander';
import { applyCommand } from './commands/apply.js';
import { checkCommand } from './commands/check.js';
import { previewCommand } from './commands/preview.js';
import { barrelCommand } from './commands/barrel.js';

// injetado pelo tsup no build a partir do package.json
declare const __NGRAO_VERSION__: string;
const VERSION = typeof __NGRAO_VERSION__ !== 'undefined' ? __NGRAO_VERSION__ : 'dev';

export const program = new Command();

program
  .name('ngrao')
  .description('Angular Reactive Architecture Operator — applies standard folder structure to Angular 19+ projects')
  .version(VERSION);

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
  .description('Generate an index.ts barrel for a specific folder (never overwrites an existing one)')
  .action(barrelCommand);
