import fs from 'fs';
import path from 'path';
import os from 'os';

export interface ProjectFile {
  rel: string;
  content: string;
}

export function createProject(files: ProjectFile[]): string {
  const cwd = fs.mkdtempSync(path.join(os.tmpdir(), 'ng-rao-fixture-'));
  for (const f of files) {
    const full = path.join(cwd, f.rel);
    fs.mkdirSync(path.dirname(full), { recursive: true });
    fs.writeFileSync(full, f.content, 'utf-8');
  }
  return cwd;
}

export function destroyProject(cwd: string): void {
  fs.rmSync(cwd, { recursive: true, force: true });
}

export function readFile(cwd: string, rel: string): string {
  return fs.readFileSync(path.join(cwd, rel), 'utf-8');
}

export function exists(cwd: string, rel: string): boolean {
  return fs.existsSync(path.join(cwd, rel));
}

// ----- fixtures de conteúdo -----

export const ANGULAR_JSON = '{"version": 1, "projects": {}}';

export const PACKAGE_JSON = JSON.stringify({
  dependencies: { '@angular/core': '^19.0.0' },
});

export const routing = (components: string[]) => `
import { Routes } from '@angular/router';
const routes: Routes = [${components.map(c => `{ path: '', component: ${c} }`).join(', ')}];
`;

export const component = (className: string, imports: string[] = []) => `
import { Component } from '@angular/core';
${imports.map(i => `import { ${i} } from '${i.toLowerCase()}.service';`).join('\n')}
@Component({ selector: 'app-root', template: '' })
export class ${className} {}
`;

export const service = (className: string, root = true) => `
import { Injectable } from '@angular/core';
@Injectable(${root ? "{ providedIn: 'root' }" : ''})
export class ${className} {}
`;

export const guard = (className: string) => `
import { Injectable } from '@angular/core';
@Injectable({ providedIn: 'root' })
export class ${className} {}
`;

export const interceptor = (className: string) => `
import { Injectable } from '@angular/core';
@Injectable()
export class ${className} {}
`;

export const model = (name: string) => `export interface ${name} { id: string; }`;

export const mock = (name: string) => `export const ${name}Mock = [];`;

export const pipe = (className: string, pipeName: string) => `
import { Pipe, PipeTransform } from '@angular/core';
@Pipe({ name: '${pipeName}', standalone: true })
export class ${className} implements PipeTransform {
  transform(value: unknown): unknown { return value; }
}
`;

export const normalizer = (fnName: string) => `
export function ${fnName}(data: unknown): unknown { return data; }
`;
