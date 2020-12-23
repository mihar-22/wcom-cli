import {
  cyan, dim, red, white, yellow,
} from 'kleur';
import { isFunction, isObject } from '../utils/unit';

export enum LogLevel {
  Silent = 0,
  Error = 1,
  Warn = 2,
  Info = 3,
  Verbose = 4,
}

export const LogLevelColor = Object.freeze({
  [LogLevel.Silent]: white,
  [LogLevel.Error]: red,
  [LogLevel.Warn]: yellow,
  [LogLevel.Info]: cyan,
  [LogLevel.Verbose]: dim,
});

let currentLogLevel = LogLevel.Info;

export function mapLogLevelStringToNumber(level: string) {
  switch (level) {
    case 'silent':
      return LogLevel.Silent;
    case 'error':
      return LogLevel.Error;
    case 'warn':
      return LogLevel.Warn;
    case 'info':
      return LogLevel.Info;
    case 'verbose':
      return LogLevel.Verbose;
    default:
      return LogLevel.Info;
  }
}

export function setGlobalLogLevel(level: LogLevel) {
  currentLogLevel = level;
}

export function log(text: unknown | (() => string), level = LogLevel.Info) {
  if ((currentLogLevel === LogLevel.Silent) || (level > currentLogLevel)) return;

  if (isFunction(text)) {
    text = text();
  }

  if (isObject(text)) {
    console.dir(text, { depth: 10 });
  } else {
    const currentColor = LogLevelColor[level];
    console.log(currentColor(text as string));
  }
}
