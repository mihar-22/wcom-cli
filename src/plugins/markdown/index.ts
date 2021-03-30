import { isString } from '../../utils/unit';
import { ComponentMeta } from '../ComponentMeta';
import { PluginBuilder, PluginFs } from '../Plugin';
import { cssPartsToMarkdown } from './converters/markdown-css-parts';
import { cssPropsToMarkdown } from './converters/markdown-css-props';
import { depsToMarkdown } from './converters/markdown-deps';
import { eventsToMarkdown } from './converters/markdown-events';
import { examplesToMarkdown } from './converters/markdown-examples';
import { methodsToMarkdown } from './converters/markdown-methods';
import { propsToMarkdown } from './converters/markdown-props';
import { slotsToMarkdown } from './converters/markdown-slots';

export interface MarkdownPluginConfig extends Record<string, unknown> {
  outputPath(
    component: ComponentMeta,
    fs: PluginFs,
  ): Promise<string | string[]>;

  transformContent(component: ComponentMeta, content: string): Promise<string>;
}

export const MARKDOWN_PLUGIN_DEFAULT_CONFIG: MarkdownPluginConfig = {
  async outputPath(component, fs) {
    return fs.resolvePath(component.source.dirPath, 'README.md');
  },
  async transformContent(_, content) {
    return content;
  },
};

export async function normalizeMarkdownPluginConfig(
  config: Partial<MarkdownPluginConfig>,
): Promise<MarkdownPluginConfig> {
  return {
    ...MARKDOWN_PLUGIN_DEFAULT_CONFIG,
    ...config,
  };
}

/**
 * Transforms component metadata into markdown (`.md`) files. By default each markdown file will be
 * output in the directory the component was declared in, feel free to change this
 * via the config options. This will run in the `transform` plugin lifecycle step.
 *
 * @option outputPath - Receives each `ComponentMeta` and it should return the path to where it's
 * respective markdown file should be output.
 * @option transformContent - Receives each `ComponentMeta` and the new markdown content as a
 * `string` and returns the transformed content.
 *
 * @example
 * ```ts
 * // wcom.config.ts
 *
 * import { markdownPlugin } from '@wcom/cli';
 *
 * export default [
 *   markdownPlugin({
 *     // Configuration options here.
 *     async outputPath(component, fs) {
 *       return fs.resolvePath(component.source.dirPath, 'README.md');
 *     },
 *   }),
 * ];
 * ```
 */
export const markdownPlugin: PluginBuilder<Partial<MarkdownPluginConfig>> = (
  config: Partial<MarkdownPluginConfig> = {},
) => ({
  name: 'wcom-markdown',

  async transform(components, fs) {
    const normalizedConfig = await normalizeMarkdownPluginConfig(config);

    await Promise.all(
      components.map(async component => {
        let targetPath = await normalizedConfig.outputPath(component, fs);

        if (isString(targetPath)) {
          targetPath = [targetPath];
        }

        return targetPath.map(async path => {
          await updateMarkdown(
            path,
            serializeDefaultComponentDoc(component),
            async userContent =>
              normalizedConfig.transformContent(
                component,
                serializeComponentDoc(userContent, component, components),
              ),
            fs,
          );
        });
      }),
    );
  },
});

async function updateMarkdown(
  targetPath: string,
  defaultMarkdown: string,
  serializeNewContent: (userContent: string) => Promise<string>,
  fs: PluginFs,
) {
  const isUpdate = await fs.pathExists(targetPath);
  const content = !isUpdate
    ? defaultMarkdown
    : (await fs.readFile(targetPath)).toString();
  const userContent = isUpdate ? getUserContent(content) : content;
  const newContent = await serializeNewContent(userContent);
  const hasContentChanged = !isUpdate || content !== newContent;
  if (!hasContentChanged) return;
  if (!isUpdate) await fs.ensureFile(targetPath);
  await fs.writeFile(targetPath, newContent);
}

const AUTO_GEN_COMMENT = '<!-- [@wcom/cli] AUTO GENERATED BELOW -->';

const getUserContent = (content: string) =>
  content.substr(0, content.indexOf(`\n${AUTO_GEN_COMMENT}`));

const serializeDefaultComponentDoc = (component: ComponentMeta) =>
  [`# ${component.tagName}`, '', component.documentation, ''].join('\n');

const serializeComponentDoc = (
  userContent: string,
  component: ComponentMeta,
  components: ComponentMeta[],
) =>
  [
    userContent,
    AUTO_GEN_COMMENT,
    '',
    ...examplesToMarkdown(component.docTags),
    ...propsToMarkdown(component.props),
    ...methodsToMarkdown(component.methods),
    ...eventsToMarkdown(component.events),
    ...slotsToMarkdown(component.slots),
    ...cssPropsToMarkdown(component.cssProps),
    ...cssPartsToMarkdown(component.cssParts),
    ...depsToMarkdown(component, components),
    '',
  ].join('\n');
