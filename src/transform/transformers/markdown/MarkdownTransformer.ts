import { relative, resolve } from 'path';
import {
  readFile, pathExists, ensureFile, writeFile,
} from 'fs-extra';
import { ComponentMeta } from '../../../discover/ComponentMeta';
import { Transformer } from '../../Transformer';
import { cssPartsToMarkdown } from './converters/cssPartsToMarkdown';
import { cssPropsToMarkdown } from './converters/cssPropsToMarkdown';
import { depsToMarkdown } from './converters/depsToMarkdown';
import { eventsToMarkdown } from './converters/eventsToMarkdown';
import { methodsToMarkdown } from './converters/methodsToMarkdown';
import { propsToMarkdown } from './converters/propsToMarkdown';
import { slotsToMarkdown } from './converters/slotsToMarkdown';
import { MarkdownTransformerConfig } from './MarkdownTransformerConfig';

export const MarkdownTransformer: Transformer<MarkdownTransformerConfig> = {
  async transform(components, config) {
    const {
      markdownOutDir, markdownIndexOutFile, noMarkdownIndex, componentsRootDir,
    } = config;

    const indicies: Index[] = [];
    const createIndex = (component: ComponentMeta, targetPath: string) => ({
      name: component.tagName,
      url: relative(markdownIndexOutFile, targetPath).replace('../', './'),
    });

    await Promise.all(
      components.map(async (component) => {
        const targetPath = getTargetPath(component, componentsRootDir, markdownOutDir);
        indicies.push(createIndex(component, targetPath));
        await updateMarkdown(
          targetPath,
          serializeDefaultComponentDoc(component),
          (userContent) => serializeComponentDoc(userContent, component, components),
        );
      }),
    );

    if (!noMarkdownIndex && indicies.length > 0) {
      await updateMarkdown(
        markdownIndexOutFile,
        serializeDefaultIndexDoc(),
        (userContent) => serializeIndexDoc(userContent, indicies),
      );
    }
  },
};

const updateMarkdown = async (
  targetPath: string,
  defaultMarkdown: string,
  serializeNewContent: (userContent: string) => string,
) => {
  const isUpdate = await pathExists(targetPath);
  const content = !isUpdate ? defaultMarkdown : (await readFile(targetPath)).toString();
  const userContent = isUpdate ? getUserContent(content) : content;
  const newContent = serializeNewContent(userContent);
  const hasContentChanged = !isUpdate || (content !== newContent);
  if (!hasContentChanged) return;
  if (!isUpdate) await ensureFile(targetPath);
  await writeFile(targetPath, newContent);
};

const getTargetPath = (component: ComponentMeta, sourceDir: string, targetRoot: string) => {
  const { source } = component;
  const sourcePath = source.filePath.replace(sourceDir, '');

  const peeledSourcePath = (sourcePath.startsWith(`/${source.dirName}`))
    ? sourcePath.replace(`/${source.dirName}/`, '')
    : sourcePath;

  return resolve(
    targetRoot,
    peeledSourcePath
      .replace('.component', '')
      .replace(source.fileExt, '.md'),
  );
};

const AUTO_GEN_COMMENT = '<!-- AUTO GENERATED BELOW -->';
const getUserContent = (content: string) => content.substr(
  0,
  content.indexOf(`\n${AUTO_GEN_COMMENT}`),
);

const serializeDefaultIndexDoc = () => [
  '# Documentation',
  '',
  'Follow the links below to find out more information about any of our components.',
  '',
  '## Components',
  '',
].join('\n');

interface Index {
  name: string
  url: string
}

const serializeIndexDoc = (
  userContent: string,
  indicies: Index[],
) => [
  userContent,
  AUTO_GEN_COMMENT,
  '',
  indicies.map((index) => `- [\`${index.name}\`](${index.url})`).join('\n'),
].join('\n');

const serializeDefaultComponentDoc = (component: ComponentMeta) => [
  `# ${component.tagName}`, '', component.documentation, '',
].join('\n');

const serializeComponentDoc = (
  userContent: string,
  component: ComponentMeta,
  components: ComponentMeta[],
) => [
  userContent,
  AUTO_GEN_COMMENT,
  '',
  ...propsToMarkdown(component.props),
  ...methodsToMarkdown(component.methods),
  ...eventsToMarkdown(component.events),
  ...slotsToMarkdown(component.slots),
  ...cssPropsToMarkdown(component.cssProps),
  ...cssPartsToMarkdown(component.cssParts),
  ...depsToMarkdown(component, components),
  '',
].join('\n');
