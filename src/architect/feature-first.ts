import path from 'path';
import type { AnalyzedFile } from '../types.js';
import { isReservedRootDir } from '../utils/features.js';

const SHARED_ROOT = 'src/app/shared/';
const SHARED_COMPONENTS_ROOT = 'src/app/shared/components/';
const COMPONENTS_ROOT = 'src/app/components/';

export interface Destination {
  dir: string;          // relativo a src/app/
  needsBarrel: boolean; // sempre false no feature-first — o modo não gera barrels
}

// Conjunto de features do projeto: as que já existem no disco + as inferidas
// dos components analisados. Um domínio só puxa arquivos pra dentro de uma
// feature se essa feature de fato existir.
export function collectFeatureNames(
  files: AnalyzedFile[],
  existingFeatures: Set<string>
): Set<string> {
  const features = new Set(existingFeatures);

  for (const file of files) {
    if (file.kind !== 'component') continue;
    if (file.filename === 'app.component.ts') continue;
    if (file.scope === 'shared') continue;
    if (file.relativePath.startsWith(COMPONENTS_ROOT)) continue;
    if (file.domain && !isReservedRootDir(file.domain)) features.add(file.domain);
  }

  return features;
}

// Resolve o destino de um arquivo no modo feature-first:
// feature no topo, global por tipo só pro que não tem dono.
export function resolveFeatureFirstDestination(
  file: AnalyzedFile,
  features: Set<string>
): Destination | null {
  const { kind, scope, domain, role, filename, relativePath } = file;

  // app.component fica na raiz de src/app/
  if (filename === 'app.component.ts') return null;
  if (kind === 'other') return null;

  // shared/components/[x]/** → components/[x]/**, preservando a subestrutura
  // (models/, services/, sub-components/ continuam junto do component)
  if (relativePath.startsWith(SHARED_COMPONENTS_ROOT)) {
    return dest(path.posix.dirname(relativePath).slice(SHARED_ROOT.length));
  }

  // já está numa pasta global de components — nada a fazer
  if (relativePath.startsWith(COMPONENTS_ROOT)) return null;

  // sub-components de feature ficam onde estão
  if (relativePath.includes('sub-components/')) return null;

  switch (kind) {
    case 'guard':
      return dest('guards');

    case 'interceptor':
      return dest('interceptors');

    // pipes são reutilizáveis por natureza — sempre globais
    case 'pipe':
      return dest('pipes');

    case 'normalizer':
      return featureOrGlobal(domain, features, 'normalizers');

    case 'component': {
      // component sem dono de feature (ex-shared) vira componente global
      if (scope === 'shared') {
        return dest(`components/${stripSuffix(filename, '.component.ts')}`);
      }
      if (!domain || isReservedRootDir(domain)) return null;
      // page roteável mora na raiz da feature; os demais ganham pasta própria.
      // component homônimo da feature também fica na raiz — home/home/ não ajuda ninguém.
      const compName = stripSuffix(filename, '.component.ts');
      return role === 'page' || compName === domain
        ? dest(domain)
        : dest(`${domain}/${compName}`);
    }

    // providedIn: 'root' não define arquitetura — o que define é ter feature dona
    case 'service':
      return featureOrGlobal(domain, features, 'services');

    case 'model':
      return featureOrGlobal(domain, features, 'models');

    case 'mock':
      return featureOrGlobal(domain, features, 'mocks');

    default:
      return null;
  }
}

// Vai pra dentro da feature quando o domínio casa com uma feature existente;
// caso contrário, pra pasta global do tipo.
function featureOrGlobal(
  domain: string,
  features: Set<string>,
  globalDir: string
): Destination {
  if (domain && !isReservedRootDir(domain) && features.has(domain)) return dest(domain);
  return dest(globalDir);
}

function dest(dir: string): Destination {
  return { dir, needsBarrel: false };
}

function stripSuffix(filename: string, suffix: string): string {
  return filename.endsWith(suffix) ? filename.slice(0, -suffix.length) : filename;
}
