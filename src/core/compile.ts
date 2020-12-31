import { dim, yellow } from 'kleur';
import {
  CompilerOptions,
  createProgram,
  createSemanticDiagnosticsBuilderProgram,
  createWatchCompilerHost,
  createWatchProgram,
  Diagnostic,
  findConfigFile,
  flattenDiagnosticMessageText,
  formatDiagnostic,
  FormatDiagnosticsHost,
  ModuleKind,
  ModuleResolutionKind,
  Program,
  readConfigFile,
  ScriptTarget,
  SourceFile,
  sys,
} from 'typescript';
import { isUndefined } from '../utils/unit';
import { log, LogLevel } from './log';

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
  const configPath = findConfigFile(
    root,
    sys.fileExists,
    'tsconfig.json',
  );

  log(() => (!isUndefined(configPath)
    ? `Using TS config file: ${configPath}`
    : `Could not find TS config file from: ${root} [using default]`), LogLevel.Info);

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
) {
  return createProgram(filePaths, options);
}

const formatHost: FormatDiagnosticsHost = {
  getCanonicalFileName: (path) => path,
  getCurrentDirectory: sys.getCurrentDirectory,
  getNewLine: () => sys.newLine,
};

function reportDiagnostic(diagnostic: Diagnostic) {
  console.log(diagnostic);

  // flattenDiagnosticMessageText(diagnostic.messageText, formatHost.getNewLine())
}

function reportWatchStatusChanged(diagnostic: Diagnostic) {
  log(`[${yellow(diagnostic.code)}] ${diagnostic.messageText}`, LogLevel.Info, false);
}

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
  host.afterProgramCreate = (builderProgram) => {
    const program = builderProgram.getProgram();
    onProgramCreate(program);
    postProgramCreateRef!(builderProgram);
  };

  return createWatchProgram(host);
}
