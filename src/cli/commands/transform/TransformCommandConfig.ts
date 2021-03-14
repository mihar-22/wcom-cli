export interface TransformCommandConfig extends Record<string, unknown> {
  pkgName: string;
  logLevel: string;
  glob?: string[];
  globs?: string[];
  cwd: string;
  configFile: string;
  // watch: boolean;
  // project: string;
}
