import { dirname, relative, resolve } from 'path';
import readPkgUp from 'read-pkg-up';
import normalizePath from 'normalize-path';
import { isUndefined } from '../utils/unit';
import { keysOfObject, StringIndexableObject } from '../utils/object';

export async function resolveCorePkgName(root: string) {
  const pkg = await readPkgUp({ cwd: root });
  return pkg?.packageJson.name;
}

export const resolvePath = (...pathSegments: string[]) =>
  normalizePath(resolve(...pathSegments));

export function resolveRelativePath(from: string, to: string) {
  const path = relative(dirname(from), to);
  return path.startsWith('.') ? path : `./${path}`;
}

export async function resolveOutputPaths<T extends StringIndexableObject>(
  cwd: string,
  config: T,
  match: (key: keyof T) => boolean,
): Promise<T> {
  const configWithResolvedPaths: T = { ...config };

  keysOfObject(config).forEach(key => {
    if (!isUndefined(config[key]) && match(key)) {
      // TODO: how to resolve this type error?
      (configWithResolvedPaths as any)[key] = resolvePath(cwd, config[key]);
    }
  });

  return configWithResolvedPaths;
}
