import fs from 'fs';
import path from 'path';

// Placeholder usado na fase de planejamento (a pasta ainda pode não ter arquivos)
export function barrelPlaceholder(dirPosix: string): string {
  return [
    '// barrel — re-exporte os arquivos desta pasta aqui',
    '// exemplo:',
    `//   export * from './<nome-do-arquivo>';`,
    `// pasta: ${dirPosix}`,
    '',
  ].join('\n');
}

// Conteúdo real do barrel: re-exporta os .ts da pasta no momento da criação.
// Se a pasta ainda estiver vazia, usa o fallback (placeholder).
export function buildBarrelContent(dirAbs: string, fallback?: string): string {
  const files = fs.existsSync(dirAbs)
    ? fs.readdirSync(dirAbs, { withFileTypes: true })
        .filter((e) => e.isFile())
        .map((e) => e.name)
        .filter(
          (f) =>
            f.endsWith('.ts') &&
            f !== 'index.ts' &&
            !f.endsWith('.spec.ts') &&
            !f.endsWith('.d.ts')
        )
        .sort()
    : [];

  if (files.length === 0) {
    return fallback ?? barrelPlaceholder(path.basename(dirAbs));
  }
  return files.map((f) => `export * from './${f.slice(0, -3)}';`).join('\n') + '\n';
}
