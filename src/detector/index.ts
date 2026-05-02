import fs from 'fs';
import path from 'path';
import type { FileEntry, FileMap } from '../types.js';

export function isAngularProject(cwd: string): boolean {
  return fs.existsSync(path.join(cwd, 'angular.json'));
}

export function getAngularVersion(cwd: string): string | null {
  const pkgPath = path.join(cwd, 'package.json');
  if (!fs.existsSync(pkgPath)) return null;

  try {
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8')) as {
      dependencies?: Record<string, string>;
      devDependencies?: Record<string, string>;
    };
    return (
      pkg.dependencies?.['@angular/core'] ??
      pkg.devDependencies?.['@angular/core'] ??
      null
    );
  } catch {
    return null;
  }
}

export function scanExistingStructure(cwd: string): FileMap {
  const appRoot = path.join(cwd, 'src', 'app');
  const entries: FileMap = [];

  if (!fs.existsSync(appRoot)) return entries;

  collectEntries(appRoot, cwd, entries);
  return entries;
}

function collectEntries(dir: string, cwd: string, entries: FileEntry[]): void {
  const items = fs.readdirSync(dir, { withFileTypes: true });

  for (const item of items) {
    const fullPath = path.join(dir, item.name);
    const relativePath = path.relative(cwd, fullPath).replace(/\\/g, '/');

    entries.push({ path: relativePath, exists: true });

    if (item.isDirectory()) {
      collectEntries(fullPath, cwd, entries);
    }
  }
}
