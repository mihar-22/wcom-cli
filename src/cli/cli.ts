import yargs from 'yargs';
import { BobConfig } from './BobConfig';

export function cli() {
  const { argv } = yargs
    .usage('Usage: $0 <command> [glob..] [options]')
    .command<BobConfig>({
    command: ['bob [glob..]', '$0'],
    describe: 'Discovers components, extracts metadata (props/methods/events etc.) and pipes results through specified transformers',
    handler: async (config) => {
      try {
        console.log(config);
        // pass to command
        // await analyzeCliCommand(config);
      } catch (e) {
        // if (isCliError(e)) {
        //   log(e.message, config);
        // } else {
        //   throw e;
        // }
      }
    },
  })
    .example('$ $0 bob --transformers vscode', '')
    .example('$ $0 bob src --transformers markdown vscode --watch', '')
    .example('$ $0 bob src/**/*.ts --transformers json', '')
    .option('discovery', {
      describe: 'Specify discoverer to use that will be responsible for finding components and extracting their metadata',
      nArgs: 1,
      choices: ['lit'],
      alias: 'd',
      default: 'lit',
    })
    .option('transformers', {
      describe: 'Specify transformers to pipe results through',
      choices: ['markdown', 'json', 'vscode', 'types', 'react', 'vue', 'vue-next', 'svelte', 'angular'],
      array: true,
      alias: 't',
      requiresArg: true,
    })
    .option('dry', {
      describe: 'Output to console instead of writing to files',
      boolean: true,
    })
    .option('watch', {
      describe: 'Watch files for any changes to re-run discovery and transformations',
      boolean: true,
      alias: 'w',
    })
    .option('verbose', {
      boolean: true,
    })
    .option('markdownAdditive', {
      describe: '',
      boolean: true,
      default: true,
    })
    .option('markdownOut', {
      describe: '',
    })
    .option('jsonOut', {
      describe: '',
      default: '',
    })
    .option('vscodeOut', {
      describe: '',
      default: '',
    })
    .option('typesOut', {
      describe: '',
      default: '',
    })
    .option('reactOut', {
      describe: '',
      default: '',
    })
    .option('vueOut', {
      describe: '',
      default: '',
    })
    .option('vueNextOut', {
      describe: '',
      default: '',
    })
    .option('svelteOutput', {
      describe: '',
      default: '',
    })
    .option('angularOutput', {
      describe: '',
      default: '',
    })
    .alias('v', 'version')
    .help('h')
    .wrap(110)
    .strict()
    .alias('h', 'help');

  if (argv.verbose) {
    /* eslint-disable-next-line no-console */
    console.log('CLI options:', argv);
  }
}
