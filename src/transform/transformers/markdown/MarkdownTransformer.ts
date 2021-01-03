import { resolve } from 'path';
import {
  readFile, pathExists, ensureFile, writeFile,
} from 'fs-extra';
import { bold } from 'kleur';
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
import { log, LogLevel } from '../../../core/log';

export const MarkdownTransformer: Transformer<MarkdownTransformerConfig> = {
  async transform(components, config) {
    const { cwd, markdownOutDir, componentsRootDir } = config;
    const sourceDir = resolve(cwd, componentsRootDir);
    const targetRoot = resolve(cwd, markdownOutDir);
    await Promise.all(
      components.map(async (component) => {
        const targetPath = getTargetPath(component, sourceDir, targetRoot);
        const isUpdate = await pathExists(targetPath);
        const content = await getMarkdownFileContent(component, targetPath, isUpdate);
        const userContent = isUpdate ? getUserContent(content) : content;
        const newContent = generateMarkdown(userContent, component, components);
        const hasContentChanged = !isUpdate || (content !== newContent);
        if (!hasContentChanged) return;
        if (!isUpdate) await ensureFile(targetPath);
        await writeFile(targetPath, newContent);
        log(
          `${isUpdate ? 'Updated' : 'Created'} documentation: ${bold(targetPath)}`,
          LogLevel.Verbose,
        );
      }),
    );
  },
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

const getMarkdownFileContent = async (
  component: ComponentMeta,
  targetPath: string,
  isUpdate: boolean,
) => (isUpdate
  ? (await readFile(targetPath)).toString()
  : generateDefaultReadme(component));

const AUTO_GEN_COMMENT = '<!-- AUTO GENERATED BELOW -->';
const getUserContent = (content: string) => content.substr(
  0,
  content.indexOf(`\n${AUTO_GEN_COMMENT}`),
);

const generateDefaultReadme = (component: ComponentMeta) => [
  `# ${component.tagName}`, '', component.documentation, '',
].join('\n');

const generateMarkdown = (
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
