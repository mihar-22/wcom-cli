import fastGlob from 'fast-glob';
import { existsSync, lstatSync } from 'fs';
import { arrayFlat } from '../../utils/array';
import { TransformCommandConfig } from '../commands/transform/TransformCommandConfig';
import { log, LogLevel } from '../log';

const IGNORE_GLOBS = ['**/node_modules/**', '**/web_modules/**'];
const DEFAULT_DIR_GLOB = '**/*.{js,jsx,ts,tsx}';
const DEFAULT_GLOBS = [DEFAULT_DIR_GLOB];

export async function parseGlobs(
  globs: string[],
  config: TransformCommandConfig,
): Promise<any> {
  if (globs.length === 0) { globs = DEFAULT_GLOBS; }
  const filePaths = await expandGlobs(globs, config);
  log(() => filePaths, LogLevel.Verbose);
  return filePaths;
}

async function expandGlobs(
  globs: string | string[],
  config?: TransformCommandConfig,
): Promise<string[]> {
  globs = Array.isArray(globs) ? globs : [globs];

  const ignoreGlobs = config?.discoverNodeModules ? [] : IGNORE_GLOBS;

  return arrayFlat(
    await Promise.all(
      globs.map((g) => {
        try {
          /**
           * Test if the glob points to a directory. If so, return the result of a new glob that
           * searches for files in the directory excluding node_modules..
           */
          const dirExists = existsSync(g) && lstatSync(g).isDirectory();

          if (dirExists) {
            return fastGlob([fastGlobNormalize(`${g}/${DEFAULT_DIR_GLOB}`)], {
              ignore: ignoreGlobs,
              absolute: true,
              followSymbolicLinks: false,
            });
          }
        } catch (e) {
          // the glob wasn't a directory
        }

        return fastGlob([fastGlobNormalize(g)], {
          ignore: ignoreGlobs,
          absolute: true,
          followSymbolicLinks: false,
        });
      }),
    ),
  );
}

/**
 * Fast glob recommends normalizing paths for windows, because fast glob expects a Unix-style path.
 * Read more here: https://github.com/mrmlnc/fast-glob#how-to-write-patterns-on-windows
 */
function fastGlobNormalize(glob: string): string {
  return glob.replace(/\\/g, '/');
}
