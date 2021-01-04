import yargs from 'yargs';
import { isCLIError } from './cli-error';
import { runTransformCommand } from './commands/transform/runTransformCommand';
import { TransformCommandConfig } from './commands/transform/TransformCommandConfig';
import { logStackTrace, mapLogLevelStringToNumber, setGlobalLogLevel } from '../core/log';

export function cli() {
  yargs
    .usage('Usage: $0 <command> [glob..] [options]')
    .command<TransformCommandConfig>({
    command: ['transform [glob..]', '$0'],
    describe: 'Discovers and transforms components into specified formats',
    handler: async (config) => {
      setGlobalLogLevel(mapLogLevelStringToNumber(config.logLevel));

      try {
        await runTransformCommand(config);
      } catch (e) {
        if (isCLIError(e)) {
          logStackTrace(e.message, e.stack);
        } else {
          throw e;
        }
      }
    },
  })
    .example('$ $0 transform --transformers vscode', '')
    .example('$ $0 transform src -t json vscode -w', '')
    .example('$ $0 transform src/**/*.ts -t json --jsonOutFile ./components.json', '')
    .option('discovery', {
      describe: 'Specify discoverer to use',
      nArgs: 1,
      choices: ['lit'],
      alias: 'd',
      default: 'lit',
    })
    .option('transformers', {
      describe: 'Specify transformers to use',
      choices: ['json', 'vscode', 'types', 'exports', 'markdown', 'all'],
      array: true,
      alias: 't',
      requiresArg: true,
      default: ['types'],
    })
    .option('project', {
      describe: 'The name of the TS config file that\'ll be used for watch mode',
      string: true,
      alias: 'p',
      default: 'tsconfig.json',
    })
    .option('dry', {
      describe: 'Output to console instead of writing to files',
      boolean: true,
      default: false,
    })
    .option('watch', {
      describe: 'Watch files for any changes to re-run discovery and transformations',
      boolean: true,
      alias: 'w',
      default: false,
    })
    .option('logLevel', {
      describe: 'Select logging level',
      nArgs: 1,
      choices: ['silent', 'error', 'warn', 'info', 'verbose'],
      default: 'info',
    })
    .option('cwd', {
      string: true,
      describe: 'The base path to use when emitting files (useful when working inside a monorepo)',
      default: process.cwd(),
    })
    .option('jsonOutFile', {
      describe: 'The path to where the JSON file should be output relative to `cwd`',
      default: './custom-elements.json',
      string: true,
    })
    .option('vscodeOutFile', {
      describe: 'The path to where the vscode file should be output relative to `cwd`',
      default: './vscode.json',
      string: true,
    })
    .option('typesOutFile', {
      describe: 'The path to where the component types (.d.ts) should be output relative to `cwd`',
      default: './src/components.d.ts',
      string: true,
    })
    .option('exportsOutFile', {
      describe: 'The path to where the exports file should be output relative to `cwd`',
      default: './src/components/index.ts',
      string: true,
    })
    .option('componentsRootDir', {
      describe: 'The root directory where components exist relative to `cwd`',
      string: true,
      default: './src/components',
    })
    .option('markdownOutDir', {
      describe: 'The path to where the markdown files should be output relative to `cwd`',
      string: true,
      default: './docs/components',
    })
    .alias('v', 'version')
    .help('h')
    .wrap(110)
    .strict()
    .alias('h', 'help')
    .argv;
}
