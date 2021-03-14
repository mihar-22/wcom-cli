import { pathExists } from 'fs-extra';
import { green, red, yellow } from 'kleur';
import { Program } from 'typescript';

import { Plugin } from '../../../plugins/Plugin';
import { parseGlobs } from '../../../utils/globs';
import { clearTerminal, log, LogLevel, logWithTime } from '../../../utils/log';
import {
  resolveConfigPaths,
  resolveCorePkgName,
  resolvePath,
} from '../../../utils/resolve';
import { isArray, isUndefined } from '../../../utils/unit';
import { compileOnce, transpileModuleOnce } from './compile';
import { discoverAndBuild } from './discover';
import { link } from './link';
import { transform } from './transform';
import { TransformCommandConfig } from './TransformCommandConfig';

async function normalizeConfig(config: TransformCommandConfig) {
  const cwd = isUndefined(config.cwd) ? process.cwd() : config.cwd;
  const normalizedConfig = await resolveConfigPaths(cwd, config);
  normalizedConfig.pkgName = (await resolveCorePkgName(normalizedConfig.cwd))!;
  return normalizedConfig;
}

export async function runTransformCommand(
  transformConfig: TransformCommandConfig,
): Promise<void> {
  clearTerminal();

  const startTransformTime = process.hrtime();

  const config = await normalizeConfig(transformConfig);
  const glob: string[] = config.glob ?? [];

  log(config, LogLevel.Verbose);

  const startCompileTime = process.hrtime();
  const filePaths = await parseGlobs(glob);
  const program = compileOnce(filePaths);
  logWithTime(`[${yellow('wcom')}] \`compile\``, startCompileTime);

  if (!(await pathExists(config.configFile))) {
    log(
      `No configuration file could be found at ${red(config.configFile)}`,
      LogLevel.Error,
    );
    return;
  }

  const plugins = (await transpileModuleOnce(config.configFile)) as Plugin[];

  if (!isArray(plugins)) {
    log(
      `Configuration file must default export an array of plugins, found ${red(
        typeof plugins,
      )}`,
      LogLevel.Error,
    );
    return;
  }

  await initPlugins(program, plugins);
  const noOfFiles = await runPlugins(program, plugins, glob, filePaths);
  await destroyPlugins(plugins);

  const noOfFilesText = green(
    `${noOfFiles} ${noOfFiles === 1 ? 'file' : 'files'}`,
  );
  logWithTime(`Finished transforming ${noOfFilesText}`, startTransformTime);
}

export async function initPlugins(
  program: Program,
  plugins: Plugin[],
): Promise<void> {
  for (let p = 0; p < plugins.length; p += 1) {
    const plugin = plugins[p];
    if (isUndefined(plugin.init)) continue;
    const startTime = process.hrtime();
    await plugin.init(program);
    logWithTime(`[${yellow(plugin.name)}] \`init\``, startTime);
  }
}

export async function runPlugins(
  program: Program,
  plugins: Plugin[],
  glob: string[],
  paths?: string[],
): Promise<number> {
  const validFilePaths = new Set(paths ?? (await parseGlobs(glob)));

  const sourceFiles = program
    .getSourceFiles()
    .filter(sf => validFilePaths.has(resolvePath(sf.fileName)))
    .sort((sfA, sfB) => (sfA.fileName > sfB.fileName ? 1 : -1));

  const checker = program.getTypeChecker();
  const components = await discoverAndBuild(checker, plugins, sourceFiles);
  const linkedComponents = await link(plugins, components, sourceFiles);
  await transform(plugins, linkedComponents);

  return sourceFiles.length;
}

export async function destroyPlugins(plugins: Plugin[]): Promise<void> {
  for (let p = 0; p < plugins.length; p += 1) {
    const plugin = plugins[p];
    if (isUndefined(plugin.destroy)) continue;
    const startTime = process.hrtime();
    await plugin.destroy();
    logWithTime(`[${yellow(plugin.name)}] \`destroy\``, startTime);
  }
}
