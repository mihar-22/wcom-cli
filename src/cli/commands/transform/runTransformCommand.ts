import { green } from 'kleur';
import { Program } from 'typescript';

import { compileOnce } from '../../../core/compile';
import { parseGlobs } from '../../../core/globs';
import { clearTerminal, log, LogLevel, logWithTime } from '../../../core/log';
import {
  resolveCorePkgName,
  resolveOutputPaths,
  resolvePath,
} from '../../../core/resolve';
import { discover } from '../../../discover';
import { transform } from '../../../transform';
import { isString, isUndefined } from '../../../utils/unit';
import { TransformCommandConfig } from './TransformCommandConfig';

async function normalizeConfig(config: TransformCommandConfig) {
  const rootPath = isUndefined(config.cwd)
    ? resolvePath(process.cwd())
    : resolvePath(process.cwd(), config.cwd);

  const configWithResolvedPaths = await resolveOutputPaths(
    rootPath,
    config,
    key => isString(key) && (key.endsWith('File') || key.endsWith('Dir')),
  );

  configWithResolvedPaths.cwd = rootPath;
  configWithResolvedPaths.pkgName = (await resolveCorePkgName(rootPath))!;
  return configWithResolvedPaths;
}

export async function runTransformCommand(
  transformConfig: TransformCommandConfig,
): Promise<void> {
  clearTerminal();

  const config = await normalizeConfig(transformConfig);
  const glob: string[] = config.glob ?? [];

  log(config, LogLevel.Verbose);

  const filePaths = await parseGlobs(glob);
  const program = compileOnce(filePaths);
  await run(program, glob, config, filePaths);
}

export async function run(
  program: Program,
  glob: string[],
  config: TransformCommandConfig,
  paths?: string[],
): Promise<void> {
  const startTime = process.hrtime();
  const validFilePaths = new Set(paths ?? (await parseGlobs(glob)));

  const sourceFiles = program
    .getSourceFiles()
    .filter(sf => validFilePaths.has(resolvePath(sf.fileName)))
    .sort((sfA, sfB) => (sfA.fileName > sfB.fileName ? 1 : -1));

  const noOfFiles = sourceFiles.length;
  const noOfFilesText = green(
    `${noOfFiles} ${noOfFiles === 1 ? 'file' : 'files'}`,
  );
  log(() => `Starting to transform ${noOfFilesText}...`, LogLevel.Info);

  const components = discover(program, sourceFiles, config.discovery);

  await Promise.all(
    config.transformers.map(transformer =>
      transform(components, transformer, { ...config }),
    ),
  );

  logWithTime(`Finished transforming ${noOfFilesText}`, startTime);
}
