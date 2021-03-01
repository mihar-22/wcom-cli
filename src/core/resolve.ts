import normalizePath from 'normalize-path';
import { dirname, relative, resolve } from 'path';
import readPkgUp from 'read-pkg-up';

import { keysOfObject } from '../utils/object';
import { isUndefined } from '../utils/unit';

export async function resolveCorePkgName(
  root: string,
): Promise<string | undefined> {
  const pkg = await readPkgUp({ cwd: root });
  return pkg?.packageJson.name;
}

export const resolvePath = (...pathSegments: string[]): string =>
  normalizePath(resolve(...pathSegments));

export function resolveRelativePath(from: string, to: string): string {
  const path = relative(dirname(from), to);
  return path.startsWith('.') ? path : `./${path}`;
}

export async function resolveOutputPaths<T extends Record<string, unknown>>(
  cwd: string,
  config: T,
  match: (key: keyof T) => boolean,
): Promise<T> {
  const configWithResolvedPaths: T = { ...config };

  keysOfObject(config).forEach(key => {
    if (!isUndefined(config[key]) && match(key)) {
      configWithResolvedPaths[key] = resolvePath(
        cwd,
        config[key] as string,
      ) as T[keyof T];
    }
  });

  return configWithResolvedPaths;
}
