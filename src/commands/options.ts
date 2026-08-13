import type { LayoutMode } from '../types.js';

// Flag --feature-first, comum a apply/check/preview
export interface LayoutOptions {
  featureFirst?: boolean;
}

export function resolveMode(options?: LayoutOptions): LayoutMode {
  return options?.featureFirst ? 'feature-first' : 'classic';
}
