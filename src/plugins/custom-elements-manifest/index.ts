import * as manifest from 'custom-elements-manifest/schema';

import { isUndefined } from '../../utils';
import { ComponentMeta } from '../ComponentMeta';
import { PluginBuilder } from '../Plugin';

export interface CustomElementsManifestPluginConfig
  extends Record<string, unknown> {
  cwd: string;
  outFile: string;
}

export const CUSTOM_ELEMENTS_MANIFEST_PLUGIN_DEFAULT_CONFIG: CustomElementsManifestPluginConfig = {
  cwd: process.cwd(),
  outFile: './custom-elements.json',
};

export async function normalizeCustomElementsManifestPluginConfig(
  config: Partial<CustomElementsManifestPluginConfig>,
): Promise<CustomElementsManifestPluginConfig> {
  return {
    ...CUSTOM_ELEMENTS_MANIFEST_PLUGIN_DEFAULT_CONFIG,
    ...config,
  };
}

/**
 * Transforms component metadata into a [custom elements manifest](https://github.com/webcomponents/custom-elements-manifest).
 * This will run in the `transform` plugin lifecycle step.
 *
 * @option cwd - The current working directory, defaults to `process.cwd()`.
 * @option outFile - Custom path to where the manifest file should be output.
 *
 * @example
 * ```ts
 * // wcom.config.ts
 *
 * import { customElementsManifestPlugin } from '@wcom/cli';
 *
 * export default [
 *   customElementsManifestPlugin({
 *     // Configuration options here.
 *     outFile: './custom-elements.json',
 *   }),
 * ];
 * ```
 */
export const customElementsManifestPlugin: PluginBuilder<
  Partial<CustomElementsManifestPluginConfig>
> = (config = {}) => ({
  name: 'wcom-custom-elements-manifest',
  async transform(components, fs) {
    const normalizedConfig = await normalizeCustomElementsManifestPluginConfig(
      config,
    );

    const output: manifest.Package = {
      schemaVersion: '0.1.0',
      modules: buildModules(components),
    };

    await fs.ensureFile(normalizedConfig.outFile);
    await fs.writeFile(
      normalizedConfig.outFile,
      JSON.stringify(output, undefined, 2),
    );
  },
});

function buildModules(components: ComponentMeta[]): manifest.Module[] {
  return [
    // Class declaration.
    ...components.map(component => ({
      kind: 'javascript-module' as const,
      path: component.source.filePath,
      declarations: [buildClassDeclaration(component)],
      exports: [
        {
          kind: 'js' as const,
          name: component.className,
          declaration: {
            name: '*',
            module: component.source.filePath,
          },
        },
      ],
    })),
    // Definition.
    ...components.map(component => ({
      kind: 'javascript-module' as const,
      path: `${component.source.dirPath}/${component.tagName}.ts`,
      declarations: [buildCustomElementDeclaration(component)],
      exports: [
        {
          kind: 'custom-element-definition' as const,
          name: component.tagName!,
          declaration: {
            name: component.className,
            module: component.source.filePath,
          },
        },
      ],
    })),
  ];
}

function buildClassDeclaration(
  component: ComponentMeta,
): manifest.ClassDeclaration {
  return {
    kind: 'class',
    name: component.className,
    description: component.documentation,
    mixins: component.heritage
      .filter(h => !isUndefined(h.mixin))
      .map(h => ({
        name: h.name,
        module: h.mixin!.source.filePath,
      })),
    members: [
      ...component.props.map(prop => ({
        name: prop.name,
        description: prop.documentation,
        kind: 'field' as const,
        privacy: 'public' as const,
        static: prop.static,
        type: {
          text: prop.typeText,
        },
        default: prop.defaultValue,
      })),
      ...component.methods.map(method => ({
        name: method.name,
        description: method.documentation,
        kind: 'method' as const,
        privacy: 'public' as const,
        parameters: method.parameters.map(parameter => ({
          name: parameter.name,
          type: {
            text: parameter.typeText,
          },
          optional: parameter.optional,
          default: parameter.defaultValue,
        })),
        return: {
          type: {
            text: method.typeInfo.returnText,
          },
        },
      })),
    ],
  };
}

function buildCustomElementDeclaration(
  component: ComponentMeta,
): manifest.ClassDeclaration & manifest.CustomElement {
  return {
    kind: 'class',
    name: component.className,
    description: component.documentation,
    tagName: component.tagName!,
    attributes: component.props
      .filter(prop => !isUndefined(prop.attribute))
      .map(prop => ({
        name: prop.attribute,
        description: prop.documentation,
        defaultValue: prop.defaultValue,
        fieldName: prop.name,
        type: {
          text: prop.typeText,
        },
      })),
    events: component.events.map(event => ({
      name: event.name,
      description: event.documentation,
      type: {
        text: event.typeInfo.resolved,
      },
    })),
    cssProperties: component.cssProps.map(cssProp => ({
      name: cssProp.name,
      description: cssProp.description,
    })),
    cssParts: component.cssParts.map(cssPart => ({
      name: cssPart.name,
      description: cssPart.description,
    })),
  };
}
