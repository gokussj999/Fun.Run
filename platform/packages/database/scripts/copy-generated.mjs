import { cpSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const pkgRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
cpSync(resolve(pkgRoot, 'src/generated'), resolve(pkgRoot, 'dist/generated'), {
  recursive: true,
});
console.log('copied prisma generated client to dist/generated');
