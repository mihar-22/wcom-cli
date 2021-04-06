import { deepFilterObjectKeys } from '../../utils/object';
import { PluginBuilder, PluginFs } from '../Plugin';

export type JsonPluginIgnoredKeys =
  | 'symbol'
  | 'declaration'
  | 'decorator'
  | 'enumDeclaration'
  | 'type'
  | 'node'
  | 'file'
  | 'signature'
  | 'returnType';

export const JSON_PLUGIN_IGNORED_KEYS = new Set<JsonPluginIgnoredKeys>([
  'symbol',
  'declaration',
  'decorator',
  'enumDeclaration',
  'type',
  'node',
  'file',
  'signature',
  'returnType',
]);

export interface JsonPluginConfig extends Record<string, unknown> {
  cwd: string;
  outFile: string;
  ignoredKeys: Set<string>;
}

export const JSON_PLUGIN_DEFAULT_CONFIG: JsonPluginConfig = {
  cwd: process.cwd(),
  outFile: './wcom.json',
  ignoredKeys: JSON_PLUGIN_IGNORED_KEYS,
};

export async function normalizeJsonPluginConfig(
  config: Partial<JsonPluginConfig>,
  fs: PluginFs,
): Promise<JsonPluginConfig> {
  return fs.resolveConfigPaths(config.cwd ?? JSON_PLUGIN_DEFAULT_CONFIG.cwd, {
    ...JSON_PLUGIN_DEFAULT_CONFIG,
    ...config,
  });
}

/**
 * Transforms component metadata into JSON format. This will run in the `transform` plugin
 * lifecycle step.
 *
 * @option cwd - The current working directory, defaults to `process.cwd()`.
 * @option outFile - Custom path to where the JSON file should be output.
 * @option ignoredKeys - Set of keys anywhere in the `ComponentMeta` you'd like to ignore.
 *
 * @example
 * ```ts
 * // wcom.config.ts
 *
 * import { jsonPlugin } from '@wcom/cli';
 *
 * export default [
 *   jsonPlugin({
 *     // Configuration options here.
 *     outFile: './wcom.json',
 *   }),
 * ];
 * ```
 */
export const jsonPlugin: PluginBuilder<Partial<JsonPluginConfig>> = (
  config = {},
) => ({
  name: 'wcom-json',

  async transform(components, fs) {
    const normalizedConfig = await normalizeJsonPluginConfig(config, fs);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const output: any = {
      noOfComponents: components.length,
      components: [],
    };

    components
      .map(component => ({
        ...component,
        dependencies: component.dependencies.map(c => c.tagName),
        dependents: component.dependents.map(c => c.tagName),
      }))
      .map(component =>
        deepFilterObjectKeys(component, normalizedConfig.ignoredKeys),
      )
      .forEach(component => {
        output.components.push(component);
      });

    await fs.ensureFile(normalizedConfig.outFile);
    await fs.writeFile(
      normalizedConfig.outFile,
      JSON.stringify(output, undefined, 2),
    );
  },
});
