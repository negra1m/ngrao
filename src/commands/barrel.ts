import fs from 'fs';
import path from 'path';
import { logger } from '../logger/index.js';

export function barrelCommand(targetPath?: string): void {
  const cwd = process.cwd();
  const folderPath = targetPath ? path.resolve(cwd, targetPath) : cwd;

  if (!fs.existsSync(folderPath)) {
    logger.error(`Pasta não encontrada: ${folderPath}`);
    process.exit(1);
  }

  if (!fs.statSync(folderPath).isDirectory()) {
    logger.error(`O caminho informado não é uma pasta: ${folderPath}`);
    process.exit(1);
  }

  const indexPath = path.join(folderPath, 'index.ts');
  const relative = path.relative(cwd, indexPath).replace(/\\/g, '/');

  if (fs.existsSync(indexPath)) {
    logger.skip(`${relative} (já existe)`);
    return;
  }

  const dir = folderPath.replace(/\\/g, '/');
  const content = [
    '// barrel — re-exporte os arquivos desta pasta aqui',
    '// exemplo:',
    `//   export * from './<nome-do-arquivo>';`,
    `// pasta: ${dir}`,
    '',
  ].join('\n');

  fs.mkdirSync(path.dirname(indexPath), { recursive: true });
  fs.writeFileSync(indexPath, content, 'utf-8');
  logger.barrel(relative);
}
