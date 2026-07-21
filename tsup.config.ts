import { defineConfig } from 'tsup';
import { readFileSync } from 'fs';
import path from 'path';

const pkg = JSON.parse(
  readFileSync(path.resolve(process.cwd(), 'package.json'), 'utf-8')
) as { version: string };

export default defineConfig({
  entry: {
    'bin/ng-rao': 'src/bin/ng-rao.ts',
    index: 'src/index.ts',
  },
  format: ['cjs'],
  target: 'node18',
  clean: true,
  dts: true,
  define: {
    __NGRAO_VERSION__: JSON.stringify(pkg.version),
  },
  banner: {
    js: '',
  },
});
