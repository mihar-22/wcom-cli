import {
  bgCyan, bgMagenta, bgRed,
  bgWhite, bgYellow, bold,
  dim, black, white,
} from 'kleur';
import { Node } from 'typescript';
import normalizePath from 'normalize-path';
import { isFunction, isObject } from '../utils/unit';
import { splitLineBreaks } from '../utils/string';

export enum LogLevel {
  Silent = 0,
  Error = 1,
  Warn = 2,
  Info = 3,
  Verbose = 4,
}

export const LogLevelColor = Object.freeze({
  [LogLevel.Silent]: bgWhite,
  [LogLevel.Error]: bgRed,
  [LogLevel.Warn]: bgYellow,
  [LogLevel.Info]: bgCyan,
  [LogLevel.Verbose]: bgMagenta,
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

export function mapLogLevelToString(level: LogLevel) {
  switch (level) {
    case LogLevel.Error:
      return 'error';
    case LogLevel.Warn:
      return 'warn';
    case LogLevel.Info:
      return 'info';
    case LogLevel.Verbose:
      return 'verbose';
    case LogLevel.Silent:
      return 'silent';
    default:
      return 'info';
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
    console.log(
      dim(`[@wcom/cli] ${currentColor(bold(black(` ${mapLogLevelToString(level).toUpperCase()} `)))}`),
      text,
      '\n',
    );
  }
}

export function logWithNode(message: string, node: Node, level = LogLevel.Info) {
  const sourceFile = node.getSourceFile();
  const sourceFilePath = normalizePath(sourceFile.fileName);
  const sourceText = sourceFile.text;
  const posStart = sourceFile.getLineAndCharacterOfPosition(node.getStart());
  const posEnd = sourceFile.getLineAndCharacterOfPosition(node.getEnd());
  const startLineNumber = posStart.line + 1;
  const endLineNumber = posEnd.line + 1;
  const isMultiLine = (endLineNumber - startLineNumber) > 0;
  const codeFrame = buildCodeFrame(sourceText, startLineNumber, endLineNumber);

  log([
    `\n\n${bold('MESSAGE')}`,
    `\n${message}`,
    `\n${bold('CODE')}\n`,
    `${dim(sourceFilePath)} ${dim('L:')}${dim((isMultiLine ? `${startLineNumber}-${endLineNumber}` : startLineNumber))}\n`,
    prettifyCodeFrame(codeFrame),
  ].join('\n'), level);
}

interface CodeFrame {
  firstLineNumber: number;
  totalLines: number;
  linesBefore: string[];
  relevantLines: string[];
  linesAfter: string[];
}

function prettifyCodeFrame(codeFrame: CodeFrame) {
  const {
    firstLineNumber, linesBefore, relevantLines, linesAfter,
  } = codeFrame;

  const printLines: string[] = [];

  const maxNoOfDigits = (firstLineNumber + codeFrame.totalLines).toString().length;
  const formatLineNumber = (lineNumber: number) => {
    const missingDigits = maxNoOfDigits - (lineNumber.toString().length);
    return (missingDigits > 0) ? `${' '.repeat(missingDigits)}${lineNumber}` : `${lineNumber}`;
  };

  const printLine = (
    line: string,
    lineNumber: number,
    isRelevant = false,
  ) => (isRelevant ? white : dim)(`${isRelevant ? '> ' : '  '}${bold(formatLineNumber(lineNumber))} |  ${line}`);

  linesBefore.forEach((line, i) => { printLines.push(printLine(line, firstLineNumber + i)); });

  relevantLines.forEach((line, i) => {
    printLines.push(printLine(line, firstLineNumber + linesBefore.length + i, true));
  });

  linesAfter.forEach((line, i) => {
    printLines.push(printLine(
      line, firstLineNumber + linesBefore.length + relevantLines.length + i,
    ));
  });

  return printLines.join('\n');
}

function buildCodeFrame(
  sourceText: string,
  startLineNumber: number,
  endLineNumber: number,
  frameSize = 5,
): CodeFrame {
  const startLineNumberMinusOne: number = startLineNumber - 1;
  const lines = splitLineBreaks(sourceText);

  const startAt = ((startLineNumberMinusOne - frameSize) < 0)
    ? 0
    : (startLineNumberMinusOne - frameSize);

  const endAt = ((endLineNumber + frameSize) > lines.length)
    ? lines.length
    : (endLineNumber + frameSize);

  const codeFrame: CodeFrame = {
    firstLineNumber: startAt + 1,
    linesBefore: [],
    relevantLines: [],
    linesAfter: [],
    totalLines: 0,
  };

  let lineCounter = 0;
  const MAX_LINES = 15;

  function buildLines(start: number, end: number) {
    if (lineCounter > (MAX_LINES - 1)) return [];

    const newLines: string[] = [];

    for (let i = start; i < end; i += 1) {
      if (lines[i] != null) {
        newLines.push(lines[i]);
        lineCounter += 1;
      }

      if (lineCounter > (MAX_LINES - 1)) {
        return newLines;
      }
    }

    return newLines;
  }

  codeFrame.linesBefore = buildLines(startAt, startLineNumberMinusOne);
  codeFrame.relevantLines = buildLines(startLineNumberMinusOne, endLineNumber);
  codeFrame.linesAfter = buildLines(endLineNumber, (endAt + 1));

  const linesHidden = endAt - startAt - lineCounter;
  if (linesHidden > 0) {
    codeFrame.linesAfter.push(dim(`${linesHidden} ${linesHidden === 1 ? 'line' : 'lines'} hidden...`));
  }

  codeFrame.totalLines = lineCounter;
  return codeFrame;
}
