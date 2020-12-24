import { resolve } from 'path';
import readPkgUp from 'read-pkg-up';
import normalizePath from 'normalize-path';
import { isUndefined } from '../../utils/unit';
import { TransformCommandConfig } from '../commands/transform/TransformCommandConfig';
import { log, LogLevel } from '../log';

export async function resolveCorePkgName(root: string) {
  const pkg = await readPkgUp({ cwd: root });
  return pkg?.packageJson.name;
}

export async function resolveOutputPaths(config: TransformCommandConfig) {
  const configWithResolvedPaths = { ...config };

  const rootPath = normalizePath(isUndefined(config.cwd)
    ? process.cwd()
    : resolve(process.cwd(), config.cwd));

  const outputFilePaths: (keyof TransformCommandConfig)[] = [
    'jsonOutFile',
    'vscodeOutFile',
    'typesOutFile',
    'markdownOutDir',
    'reactOutDir',
    'vueOutDir',
    'vueNextOutDir',
    'svelteOutputDir',
    'angularOutputDir',
  ];

  configWithResolvedPaths.cwd = rootPath;
  outputFilePaths.forEach((key) => {
    if (!isUndefined(config[key])) {
      configWithResolvedPaths[key] = normalizePath(resolve(rootPath, config[key]));
    }
  });

  if (isUndefined(config.corePkgName)) {
    const corePkgName = await resolveCorePkgName(rootPath) ?? '';
    configWithResolvedPaths.corePkgName = corePkgName;
    if (corePkgName === '') {
      log(() => 'Could not find core package.json', LogLevel.Verbose);
    } else {
      log(() => `Found core package with name: ${corePkgName}`, LogLevel.Verbose);
    }
  }

  return configWithResolvedPaths;
}
