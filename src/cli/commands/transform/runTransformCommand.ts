import { Program } from 'typescript';
import normalizePath from 'normalize-path';
import { green } from 'kleur';
import { discover } from '../../../discover';
import { transform } from '../../../transform';
import { parseGlobs } from '../../core/globs';
import { resolveOutputPaths } from '../../core/resolve';
import { compileAndWatch, compileOnce } from '../../core/compile';
import { log, LogLevel } from '../../log';
import { TransformCommandConfig } from './TransformCommandConfig';

export async function runTransformCommand(transformConfig: TransformCommandConfig) {
  const config = await resolveOutputPaths(transformConfig);
  const glob: string[] = config.glob ?? [];

  log(config, LogLevel.Verbose);

  if (config.watch) {
    compileAndWatch(config.cwd, config.tsconfig, undefined, async (program) => {
      await run(program, glob, config);
    });
  } else {
    const filePaths = await parseGlobs(glob, config);
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
  log(() => 'Starting transformations', LogLevel.Info);

  const validFilePaths = new Set(paths ?? await parseGlobs(glob, { ...config }));

  const sourceFiles = program
    .getSourceFiles()
    .filter((sf) => validFilePaths.has(normalizePath(sf.fileName)))
    .sort((sfA, sfB) => (sfA.fileName > sfB.fileName ? 1 : -1));

  const components = discover(program, sourceFiles, config.discovery);

  config.transformers.forEach((transformer) => {
    transform(components, transformer, { ...config });
  });

  const totalTime = process.hrtime(startTime);
  log(
    () => `Finished transformations in ${green(`${((totalTime[0] * 1000) + (totalTime[1] / 1000000)).toFixed(2)}ms`)}`,
    LogLevel.Info,
  );
}
