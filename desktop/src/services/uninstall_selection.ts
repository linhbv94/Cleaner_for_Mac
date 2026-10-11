import type { AssociatedFile } from '../types';

export function defaultUninstallPaths(files: AssociatedFile[]): Set<string> {
  return new Set(files
    .filter(file => file.file_type !== 'discovered' && file.is_selected_by_default !== false)
    .map(file => file.path));
}
