import { yellow } from 'kleur';
import {
  CompilerOptions,
  createProgram,
  createSemanticDiagnosticsBuilderProgram,
  createWatchCompilerHost,
  createWatchProgram,
  Diagnostic,
  DiagnosticCategory,
  findConfigFile,
  flattenDiagnosticMessageText,
  ModuleKind,
  ModuleResolutionKind,
  Program,
  readConfigFile,
  ScriptTarget,
  SourceFile,
  sys,
} from 'typescript';

import { isUndefined } from '../utils/unit';
import { log, LogLevel, reportDiagnosticByLine } from './log';

/**
 * The most general version of compiler options.
 */
const defaultOptions: CompilerOptions = {
  noEmitOnError: false,
  allowJs: true,
  experimentalDecorators: true,
  target: ScriptTarget.Latest,
  downlevelIteration: true,
  module: ModuleKind.ESNext,
  strictNullChecks: true,
  moduleResolution: ModuleResolutionKind.NodeJs,
  esModuleInterop: true,
  noEmit: true,
  pretty: true,
  allowSyntheticDefaultImports: true,
  allowUnreachableCode: true,
  allowUnusedLabels: true,
  skipLibCheck: true,
};

export function readTsConfigFile(root: string) {
  const configPath = findConfigFile(root, sys.fileExists, 'tsconfig.json');

  log(
    () =>
      !isUndefined(configPath)
        ? `Using TS config file: ${configPath}`
        : `Could not find TS config file from: ${root} [using default]`,
    LogLevel.Info,
  );

  const tsConfig = !isUndefined(configPath)
    ? readConfigFile(configPath!, sys.readFile).config
    : undefined;

  return tsConfig;
}

export interface CompileResult {
  program: Program;
  files: SourceFile[];
}

export function compileOnce(
  filePaths: string[],
  options: CompilerOptions = defaultOptions,
): Program {
  return createProgram(filePaths, options);
}

const tsDiagnosticCategoryToLogLevel: Record<DiagnosticCategory, LogLevel> = {
  [DiagnosticCategory.Warning]: LogLevel.Warn,
  [DiagnosticCategory.Error]: LogLevel.Error,
  [DiagnosticCategory.Message]: LogLevel.Info,
  [DiagnosticCategory.Suggestion]: LogLevel.Info,
};

function reportDiagnostic(diagnostic: Diagnostic) {
  const sourceFile = diagnostic.file;
  const message = flattenDiagnosticMessageText(
    diagnostic.messageText,
    sys.newLine,
  );
  const logLevel = tsDiagnosticCategoryToLogLevel[diagnostic.category];
  const pos = diagnostic.start
    ? sourceFile?.getLineAndCharacterOfPosition(diagnostic.start)
    : undefined;
  if (isUndefined(sourceFile) || isUndefined(pos)) {
    log(message, logLevel);
  } else {
    reportDiagnosticByLine(message, sourceFile, pos.line + 1, logLevel);
  }
}

function reportWatchStatusChanged(diagnostic: Diagnostic) {
  log(`[${yellow(diagnostic.code)}] ${diagnostic.messageText}`, LogLevel.Info);
}

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export function compileAndWatch(
  root: string,
  configFileName: string,
  options: CompilerOptions = defaultOptions,
  onProgramCreate: (program: Program) => void | Promise<void>,
) {
  const host = createWatchCompilerHost(
    configFileName,
    {
      ...options,
      baseUrl: root,
    },
    sys,
    createSemanticDiagnosticsBuilderProgram,
    reportDiagnostic,
    reportWatchStatusChanged,
  );

  const postProgramCreateRef = host.afterProgramCreate;
  host.afterProgramCreate = builderProgram => {
    const program = builderProgram.getProgram();
    onProgramCreate(program);
    postProgramCreateRef!(builderProgram);
  };

  return createWatchProgram(host);
}
