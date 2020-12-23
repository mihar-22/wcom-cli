import {
  CompilerOptions,
  createProgram,
  createSemanticDiagnosticsBuilderProgram,
  createWatchCompilerHost,
  createWatchProgram,
  findConfigFile,
  ModuleKind,
  ModuleResolutionKind,
  Program,
  readConfigFile,
  ScriptTarget,
  SourceFile,
  sys,
} from 'typescript';
import { isUndefined } from '../../utils/unit';
import { log, LogLevel } from '../log';

/**
 * The most general version of compiler options.
 */
const defaultOptions: CompilerOptions = {
  noEmitOnError: false,
  allowJs: true,
  maxNodeModuleJsDepth: 3,
  experimentalDecorators: true,
  target: ScriptTarget.Latest,
  downlevelIteration: true,
  module: ModuleKind.ESNext,
  strictNullChecks: true,
  moduleResolution: ModuleResolutionKind.NodeJs,
  esModuleInterop: true,
  noEmit: true,
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

  if (!isUndefined(tsConfig) && !(tsConfig.compilerOptions.experimentalDecorators)) {
    log(
      () => '`compilerOptions.experimentalDecorators` is required, turning it on by default',
      LogLevel.Warn,
    );

    tsConfig.compilerOptions.experimentalDecorators = true;
  }

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

export function compileAndWatch(
  filePaths: string[],
  options: CompilerOptions = defaultOptions,
  onProgramCreate: (program: Program) => void | Promise<void>,
) {
  filePaths = Array.isArray(filePaths) ? filePaths : [filePaths];

  const host = createWatchCompilerHost(
    filePaths,
    options,
    sys,
    createSemanticDiagnosticsBuilderProgram,
  );

  const postProgramCreateRef = host.afterProgramCreate;
  host.afterProgramCreate = (builderProgram) => {
    const program = builderProgram.getProgram();
    onProgramCreate(program);
    postProgramCreateRef!(builderProgram);
  };

  createWatchProgram(host);
}
