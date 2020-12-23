import { parseGlobs } from '../../core/globs';
import { resolveOutputPaths } from '../../core/resolvePaths';
import { compileAndWatch, readTsConfigFile } from '../../core/tsCompiler';
import { TransformCommandConfig } from './TransformCommandConfig';

export async function runTransformCommand(transformConfig: TransformCommandConfig) {
  const config = resolveOutputPaths(transformConfig);
  const filePaths = await parseGlobs(config.glob ?? [], config);
  const tsConfig = readTsConfigFile(config.cwd);

  if (config.watch) {
    compileAndWatch(filePaths, tsConfig, () => {
      console.log('update');
      // pass program to fn below
    });
  } else {
    // const result = compileOnce(filePaths, tsConfig);
    // pass to fn below.
  }
}

// const validPaths = new Set(Array.isArray(filePaths) ? filePaths : [filePaths]);
// const files = program
//   .getSourceFiles()
//   .filter((sf) => validPaths.has(sf.fileName))
//   .sort((sfA, sfB) => (sfA.fileName > sfB.fileName ? 1 : -1));

// We repeat this process {1, infinite}
// run discovery
// take standard result and pass it transformers
// output it (dry??)
