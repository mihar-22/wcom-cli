import yargs from 'yargs';
import { isCLIError } from './cli-error';
import { runTransformCommand } from './commands/transform/runTransformCommand';
import { TransformCommandConfig } from './commands/transform/TransformCommandConfig';
import {
  log, LogLevel, mapLogLevelStringToNumber, setGlobalLogLevel,
} from '../core/log';

export function cli() {
  yargs
    .usage('Usage: $0 <command> [glob..] [options]')
    .command<TransformCommandConfig>({
    command: ['transform [glob..]', '$0'],
    describe: 'Transforms components into specified formats',
    handler: async (config) => {
      setGlobalLogLevel(mapLogLevelStringToNumber(config.logLevel));

      try {
        await runTransformCommand(config);
      } catch (e) {
        if (isCLIError(e)) {
          log(e.message, LogLevel.Error);
        } else {
          throw e;
        }
      }
    },
  })
    .example('$ $0 transform --transformers vscode', '')
    .example('$ $0 transform src --transformers json vscode --watch', '')
    .example('$ $0 transform src/**/*.ts --transformers json --jsonOutFile ./components.json', '')
    .option('discovery', {
      describe: 'Specify discoverer to use that will be responsible for finding components and extracting their metadata',
      nArgs: 1,
      choices: ['lit'],
      alias: 'd',
      default: 'lit',
    })
    .option('transformers', {
      describe: 'Specify transformers to use',
      choices: ['json', 'vscode', 'types', 'markdown', 'react', 'vue', 'vue-next', 'svelte', 'angular', 'all'],
      array: true,
      alias: 't',
      requiresArg: true,
      default: ['vscode', 'types'],
    })
    .option('tsconfig', {
      describe: 'The name of the TS config file that\'ll be used for watch mode',
      string: true,
      default: 'tsconfig.json',
    })
    .option('corePkgName', {
      describe: 'The name of the core package contains the your web components (eg: @wcom/core)',
      string: true,
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
      default: './src/vscode-html.json',
      string: true,
    })
    .option('typesOutFile', {
      describe: 'The path to where the TypeScript typings should be output relative to `cwd`',
      default: './src/components.d.ts',
      string: true,
    })
    .option('markdownOutDir', {
      describe: 'The path to the directory where the Markdown files should be output relative to `cwd`',
      string: true,
    })
    .option('reactOutDir', {
      describe: 'The path to the directory where the React components should be output relative to `cwd`',
      default: '../integrations/react/src/components',
      string: true,
    })
    .option('vueOutDir', {
      describe: 'The path to the directory where the Vue 2 components should be output relative to `cwd`',
      default: '../integrations/vue/src/components',
      string: true,
    })
    .option('vueNextOutDir', {
      describe: 'The path to the directory where the Vue 3 components should be output relative to `cwd`',
      default: '../integrations/vue-next/src/components',
      string: true,
    })
    .option('svelteOutputDir', {
      describe: 'The path to the directory where the Svelte components should be output relative to `cwd`',
      default: '../integrations/svelte/src/components',
      string: true,
    })
    .option('angularOutputDir', {
      describe: 'The path to the directory where the Angular components should be output relative to `cwd`',
      default: '../integrations/angular/components',
      string: true,
    })
    .alias('v', 'version')
    .help('h')
    .wrap(110)
    .strict()
    .alias('h', 'help')
    .argv;
}
