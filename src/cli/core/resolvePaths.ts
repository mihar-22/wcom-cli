import { resolve } from 'path';
import { isUndefined } from '../../utils/unit';
import { TransformCommandConfig } from '../commands/transform/TransformCommandConfig';

export function resolveOutputPaths(config: TransformCommandConfig) {
  const configWithResolvedPaths = { ...config };

  const rootPath = isUndefined(config.cwd)
    ? process.cwd()
    : resolve(process.cwd(), config.cwd);

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
      configWithResolvedPaths[key] = resolve(rootPath, config[key]);
    }
  });

  return configWithResolvedPaths;
}
