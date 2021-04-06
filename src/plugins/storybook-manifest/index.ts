import {
  CssPartMeta,
  CssPropMeta,
  EventMeta,
  MethodMeta,
  PropMeta,
  SlotMeta,
} from '../ComponentMeta';
import { PluginBuilder } from '../Plugin';

export interface StorybookManifestPluginConfig extends Record<string, unknown> {
  cwd: string;
  outFile: string;
  extendAttribute?(attribute: PropMeta): Partial<StorybookItem> | undefined;
  extendProperty?(property: PropMeta): Partial<StorybookItem> | undefined;
  extendMethod?(method: MethodMeta): Partial<StorybookItem> | undefined;
  extendEvent?(event: EventMeta): Partial<StorybookItem> | undefined;
  extendSlot?(slot: SlotMeta): Partial<StorybookItem> | undefined;
  extendCssProperty?(cssProp: CssPropMeta): Partial<StorybookItem> | undefined;
  extendCssPart?(cssPart: CssPartMeta): Partial<StorybookItem> | undefined;
}

export const STORYBOOK_MANIFEST_PLUGIN_DEFAULT_CONFIG: StorybookManifestPluginConfig = {
  cwd: process.cwd(),
  outFile: './storybook.json',
};

export async function normalizeStorybookManifestPluginConfig(
  config: Partial<StorybookManifestPluginConfig>,
): Promise<StorybookManifestPluginConfig> {
  return {
    ...STORYBOOK_MANIFEST_PLUGIN_DEFAULT_CONFIG,
    ...config,
  };
}

/**
 * Transforms component metadata into a Storybook manifest file that can be used to
 * automatically infer arg types. This will run in the `transform` plugin lifecycle step.
 *
 * @option cwd - The current working directory, defaults to `process.cwd()`.
 * @option outFile - Custom path to where the manifest file should be output.
 * @option extendAttribute - Can be used to extend the JSON output of component attributes.
 * @option extendProperty - Can be used to extend the JSON output of component properties.
 * @option extendMethod - Can be used to extend the JSON output of component methods.
 * @option extendEvent - Can be used to extend the JSON output of component events.
 * @option extendSlot - Can be used to extend the JSON output of component slots.
 * @option extendCssProperty - Can be used to extend the JSON output of component CSS properties.
 * @option extendCssPart - Can be used to extend the JSON output of component CSS parts.
 *
 * @example
 * ```ts
 *
 * // wcom.config.ts
 *
 * import { storybookManifestPlugin } from '@wcom/cli';
 *
 * export default [
 *   storybookManifestPlugin({
 *     // Configuration options here.
 *     outFile: './storybook.json',
 *   }),
 * ];
 * ```
 *
 * ```js
 *
 * // .storybook/bootstrap.js
 *
 * import { setCustomElements } from '@storybook/web-components';
 * import manifest from '../storybook.json';
 *
 * setCustomElements(manifest);
 * ```
 *
 * ```js
 *
 * // .storybook/main.js
 *
 * modules.exports = {
 *   stories: ['./bootstrap.js', '...'],
 *   // ...
 * }
 * ```
 */
export const storybookManifestPlugin: PluginBuilder<
  Partial<StorybookManifestPluginConfig>
> = (config = {}) => ({
  name: 'wcom-storybook-manifest',
  async transform(components, fs) {
    const normalizedConfig = await normalizeStorybookManifestPluginConfig(
      config,
    );

    const output: StorybookManifest = {
      tags: components.map(component => ({
        name: component.tagName!,
        description: component.documentation ?? '',
        attributes: undefined,
        properties: component.props
          .filter(prop => !prop.static && !prop.internal)
          .map(prop => ({
            name: prop.name,
            attribute: prop.attribute,
            description: prop.documentation ?? '',
            type: prop.typeInfo.original,
            default:
              prop.defaultValue.length > 0 ? prop.defaultValue : undefined,
            ...(normalizedConfig.extendProperty?.(prop) ?? {}),
          })),
        events: component.events.map(event => ({
          name: event.name,
          description: event.documentation ?? '',
          type: event.typeInfo.resolved,
          ...(normalizedConfig.extendEvent?.(event) ?? {}),
        })),
        methods: component.methods
          .filter(method => !method.static && !method.internal)
          .map(method => ({
            name: method.name,
            description: method.documentation ?? '',
            type: method.typeInfo.signatureText,
            ...(normalizedConfig.extendMethod?.(method) ?? {}),
          })),
        slots: component.slots.map(slot => ({
          name: slot.name,
          description: slot.description ?? '',
          ...(normalizedConfig.extendSlot?.(slot) ?? {}),
        })),
        cssProperties: component.cssProps.map(cssProp => ({
          name: cssProp.name,
          description: cssProp.description ?? '',
          ...(normalizedConfig.extendCssProperty?.(cssProp) ?? {}),
        })),
        cssParts: component.cssParts.map(cssPart => ({
          name: cssPart.name,
          description: cssPart.description ?? '',
          ...(normalizedConfig.extendCssPart?.(cssPart) ?? {}),
        })),
      })),
    };

    await fs.ensureFile(normalizedConfig.outFile);
    await fs.writeFile(
      normalizedConfig.outFile,
      JSON.stringify(output, undefined, 2),
    );
  },
});

/**
 * Seems like Storybook tests are based on [`web-component-analyzer`](https://github.com/runem/web-component-analyzer),
 * so it relies on the `custom-elements.json` file that the library outputs which doesn't match the
 * official schema.
 *
 * @link https://github.com/storybookjs/storybook/blob/next/addons/docs/src/frameworks/web-components/custom-elements.ts
 * @schema https://github.com/webcomponents/custom-elements-manifest
 */
export interface StorybookManifest<
  ItemType extends StorybookItem = StorybookItem
> {
  tags: StorybookCustomElement<ItemType>[];
}

export interface StorybookCustomElement<
  ItemType extends StorybookItem = StorybookItem
> {
  name: string;
  description: string;
  attributes?: ItemType[];
  properties?: ItemType[];
  events?: ItemType[];
  methods?: ItemType[];
  slots?: ItemType[];
  cssProperties?: ItemType[];
  cssParts?: ItemType[];
}

export interface StorybookItem extends Record<string, unknown> {
  name: string;
  type?: string;
  description: string;
  default?: unknown;
  defaultValue?: unknown;
}
