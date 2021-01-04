import { relative, resolve } from 'path';
import {
  readFile, pathExists, ensureFile, writeFile,
} from 'fs-extra';
import { ComponentMeta } from '../../../discover/ComponentMeta';
import { Transformer } from '../../Transformer';
import { cssPartsToMarkdown } from './converters/markdown-css-parts';
import { cssPropsToMarkdown } from './converters/markdown-css-props';
import { depsToMarkdown } from './converters/markdown-dependencies';
import { eventsToMarkdown } from './converters/markdown-events';
import { methodsToMarkdown } from './converters/markdown-methods';
import { propsToMarkdown } from './converters/markdown-props';
import { slotsToMarkdown } from './converters/markdown-slots';
import { MarkdownTransformerConfig } from './MarkdownTransformerConfig';

export const MarkdownTransformer: Transformer<MarkdownTransformerConfig> = {
  async transform(components, config) {
    const {
      cwd, markdownOutDir, markdownIndexOutFile,
      noMarkdownIndex, componentsRootDir,
    } = config;
    const sourceDir = resolve(cwd, componentsRootDir);
    const targetRoot = resolve(cwd, markdownOutDir);
    const targetIndexPath = resolve(cwd, markdownIndexOutFile ?? '');
    const indicies: Index[] = [];

    const createIndex = (component: ComponentMeta, targetPath: string) => ({
      name: component.tagName,
      url: relative(targetIndexPath, targetPath).replace('../', './'),
    });

    await Promise.all(
      components.map(async (component) => {
        const targetPath = getTargetPath(component, sourceDir, targetRoot);
        indicies.push(createIndex(component, targetPath));
        await updateMarkdown(
          targetPath,
          generateDefaultComponentDoc(component),
          (userContent) => generateComponentDoc(userContent, component, components),
        );
      }),
    );

    if (!noMarkdownIndex && indicies.length > 0) {
      await updateMarkdown(
        targetIndexPath,
        generateDefaultIndexDoc(),
        (userContent) => generateIndexDoc(userContent, indicies),
      );
    }
  },
};

const updateMarkdown = async (
  targetPath: string,
  defaultMarkdown: string,
  generateNewContent: (userContent: string) => string,
) => {
  const isUpdate = await pathExists(targetPath);
  const content = !isUpdate ? defaultMarkdown : (await readFile(targetPath)).toString();
  const userContent = isUpdate ? getUserContent(content) : content;
  const newContent = generateNewContent(userContent);
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

const generateDefaultIndexDoc = () => [
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

const generateIndexDoc = (
  userContent: string,
  indicies: Index[],
) => [
  userContent,
  AUTO_GEN_COMMENT,
  '',
  indicies.map((index) => `- [\`${index.name}\`](${index.url})`).join('\n'),
].join('\n');

const generateDefaultComponentDoc = (component: ComponentMeta) => [
  `# ${component.tagName}`, '', component.documentation, '',
].join('\n');

const generateComponentDoc = (
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
