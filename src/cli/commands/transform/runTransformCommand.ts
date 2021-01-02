import { Program } from 'typescript';
import { green } from 'kleur';
import { discover } from '../../../discover';
import { transform } from '../../../transform';
import { parseGlobs } from '../../../core/globs';
import { compileAndWatch, compileOnce } from '../../../core/compile';
import { log, LogLevel } from '../../../core/log';
import { TransformCommandConfig } from './TransformCommandConfig';
import { resolveCorePkgName, resolveOutputPaths, resolvePath } from '../../../core/resolve';
import { isUndefined } from '../../../utils/unit';

async function normalizeConfig(config: TransformCommandConfig) {
  const rootPath = isUndefined(config.cwd)
    ? resolvePath(process.cwd())
    : resolvePath(process.cwd(), config.cwd);

  const configWithResolvedPaths = await resolveOutputPaths(
    rootPath,
    config,
    (key) => key.endsWith('File') || key.endsWith('Dir'),
  );

  configWithResolvedPaths.cwd = rootPath;

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

export async function runTransformCommand(transformConfig: TransformCommandConfig) {
  const config = await normalizeConfig(transformConfig);
  const glob: string[] = config.glob ?? [];

  log(config, LogLevel.Verbose);

  if (config.watch) {
    compileAndWatch(config.cwd, config.project, undefined, async (program) => {
      await run(program, glob, config);
    });
  } else {
    const filePaths = await parseGlobs(glob);
    const program = compileOnce(filePaths);
    await run(program, glob, config, filePaths);
  }
}

export async function run(
  program: Program,
  glob: string[],
  config: TransformCommandConfig,
  paths?: string[],
) {
  const startTime = process.hrtime();
  const validFilePaths = new Set(paths ?? await parseGlobs(glob));

  const sourceFiles = program
    .getSourceFiles()
    .filter((sf) => validFilePaths.has(resolvePath(sf.fileName)))
    .sort((sfA, sfB) => (sfA.fileName > sfB.fileName ? 1 : -1));

  const noOfFiles = sourceFiles.length;
  const noOfFilesText = green(`${noOfFiles} ${(noOfFiles === 1) ? 'file' : 'files'}`);
  log(() => `Starting to transform ${(noOfFilesText)}...`, LogLevel.Info);

  const components = discover(program, sourceFiles, config.discovery);

  await Promise.all(config.transformers
    .map((transformer) => transform(components, transformer, { ...config })));

  const totalTime = process.hrtime(startTime);
  const totalTimeText = green(`${((totalTime[0] * 1000) + (totalTime[1] / 1000000)).toFixed(2)}ms`);
  log(() => `Finished transforming ${noOfFilesText} in ${totalTimeText}.`, LogLevel.Info);
}
