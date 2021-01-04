import { MarkdownTable } from './markdown-utils';
import { PropMeta } from '../../../../discover/ComponentMeta';

const getPropertyColumn = (prop: PropMeta) => {
  const requiredText = prop.required ? ' _(required)_' : '';
  const readonlyText = prop.readonly ? ' _(readonly)_' : '';
  return `\`${prop.name}\`${requiredText}${readonlyText}`;
};

const getDescriptionColumn = (prop: PropMeta) => {
  const deprecatedText = '<span style="color:red">**[DEPRECATED]**</span><br/><br/>';
  return `${prop.deprecated ? deprecatedText : ''}${prop.documentation}`;
};

export const propsToMarkdown = (props: PropMeta[]) => {
  const content: string[] = [];

  if (props.length === 0) return content;

  content.push('## Properties');
  content.push('');

  const table = new MarkdownTable();

  table.addHeader(['Property', 'Description', 'Type', 'Default']);

  props
    .filter((prop) => !prop.internal)
    .forEach((prop) => {
      table.addRow([
        getPropertyColumn(prop),
        getDescriptionColumn(prop),
        `\`${prop.typeInfo.resolved}\``,
        `\`${prop.defaultValue}\``,
      ]);
    });

  content.push(...table.toMarkdown());
  content.push('');
  content.push('');

  return content;
};
