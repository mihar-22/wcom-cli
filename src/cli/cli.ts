import yargs from 'yargs';

import {
  logStackTrace,
  mapLogLevelStringToNumber,
  setGlobalLogLevel,
} from '../utils/log';
import { isCLIError } from './cli-error';
import { runTransformCommand } from './commands/transform/run-transform';
import { TransformCommandConfig } from './commands/transform/TransformCommandConfig';

export function cli(): void {
  yargs
    .usage('Usage: $0 <command> [glob..] [options]')
    .command<TransformCommandConfig>({
      command: ['transform [glob..]', '$0'],
      describe: 'Discovers and transforms component metadata.',
      handler: async config => {
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
    .example('$ $0 transform', '')
    .option('cwd', {
      string: true,
      describe:
        'The base path to use when emitting files (useful when working inside a monorepo).',
      default: process.cwd(),
    })
    .option('logLevel', {
      describe: 'Select logging level.',
      nArgs: 1,
      choices: ['silent', 'error', 'warn', 'info', 'verbose'],
      default: 'info',
    })
    .option('configFile', {
      string: true,
      describe: 'The path to your configuration file.',
      default: './wcom.config.ts',
    })
    .alias('v', 'version')
    .help('h')
    .wrap(110)
    .strict()
    .alias('h', 'help').argv;
}
