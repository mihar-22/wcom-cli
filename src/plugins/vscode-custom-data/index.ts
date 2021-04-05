import { escapeQuotes } from '../../utils/string';
import { isUndefined } from '../../utils/unit';
import { PluginBuilder, PluginFs } from '../Plugin';

export interface VscodeCustomDataPluginConfig extends Record<string, unknown> {
  cwd: string;
  outFile: string;
}

export const VSCODE_CUSTOM_DATA_PLUGIN_DEFAULT_CONFIG: VscodeCustomDataPluginConfig = {
  cwd: process.cwd(),
  outFile: './vscode.html-data.json',
};

export async function normalizeVscodeCustomDataPluginConfig(
  config: Partial<VscodeCustomDataPluginConfig>,
  fs: PluginFs,
): Promise<VscodeCustomDataPluginConfig> {
  return fs.resolveConfigPaths(
    config.cwd ?? VSCODE_CUSTOM_DATA_PLUGIN_DEFAULT_CONFIG.cwd,
    {
      ...VSCODE_CUSTOM_DATA_PLUGIN_DEFAULT_CONFIG,
      ...config,
    },
  );
}

/**
 * Transforms component metadata into [VSCode Custom Data](https://github.com/microsoft/vscode-custom-data).
 * This will run in the `transform` plugin lifecycle step.
 *
 * @option cwd - The current working directory, defaults to `process.cwd()`.
 * @option outFile - Custom path to where the file should be output.
 *
 * @example
 * ```ts
 * // wcom.config.ts
 *
 * import { vscodeCustomDataPlugin } from '@wcom/cli';
 *
 * export default [
 *   vscodeCustomDataPlugin({
 *     // Configuration options here.
 *     outFile: './vscode.html-data.json',
 *   }),
 * ];
 * ```
 */
export const vscodeCustomDataPlugin: PluginBuilder<
  Partial<VscodeCustomDataPluginConfig>
> = (config = {}) => ({
  name: 'wcom-vscode',

  async transform(components, fs) {
    const normalizedConfig = await normalizeVscodeCustomDataPluginConfig(
      config,
      fs,
    );

    const output: HTMLDataV1 = {
      version: 1.1,
      tags: [],
    };

    components
      .filter(component => !isUndefined(component.tagName))
      .forEach(component => {
        output.tags?.push({
          name: component.tagName!,
          description: component.documentation,
          attributes: component.props
            .filter(
              prop => !!prop.attribute && !prop.readonly && !prop.internal,
            )
            .map(prop => ({
              name: prop.attribute,
              description: prop.documentation,
              values:
                ['string', 'number'].includes(prop.typeText) &&
                prop.typeInfo.original.includes('|')
                  ? prop.typeInfo.original
                      .split('|')
                      .map(v => ({ name: escapeQuotes(v.trim()) }))
                  : undefined,
            })),
        });
      });

    await fs.ensureFile(normalizedConfig.outFile);
    await fs.writeFile(
      normalizedConfig.outFile,
      JSON.stringify(output, undefined, 2),
    );
  },
});

/**
 * https://github.com/microsoft/vscode-html-languageservice/blob/master/src/htmlLanguageTypes.ts#L164
 */

interface IReference {
  name: string;
  url: string;
}

interface ITagData {
  name: string;
  description?: string;
  attributes: IAttributeData[];
  references?: IReference[];
}

interface IAttributeData {
  name: string;
  description?: string;
  valueSet?: string;
  values?: IValueData[];
  references?: IReference[];
}

interface IValueData {
  name: string;
  description?: string;
  references?: IReference[];
}

interface IValueSet {
  name: string;
  values: IValueData[];
}

interface HTMLDataV1 {
  version: 1 | 1.1;
  tags?: ITagData[];
  globalAttributes?: IAttributeData[];
  valueSets?: IValueSet[];
}
