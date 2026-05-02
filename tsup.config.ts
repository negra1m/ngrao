import { defineConfig } from 'tsup';

export default defineConfig({
  entry: {
    'bin/ng-rao': 'src/bin/ng-rao.ts',
    index: 'src/index.ts',
  },
  format: ['cjs'],
  target: 'node18',
  clean: true,
  dts: true,
  banner: {
    js: '',
  },
});
