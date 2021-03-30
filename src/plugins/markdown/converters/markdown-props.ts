import { PropMeta } from '../../ComponentMeta';
import { MarkdownTable } from './markdown-utils';

function getPropertyColumn(prop: PropMeta): string {
  const modifiers: string[] = [];
  if (prop.required) modifiers.push('required');
  if (prop.readonly) modifiers.push('readonly');
  if (prop.static) modifiers.push('static');
  const modifiersText =
    modifiers.length > 0 ? ` _(${modifiers.join('/')})_` : '';
  return `\`${prop.name}\`${modifiersText}`;
}

function getDescriptionColumn(prop: PropMeta): string {
  const deprecatedText =
    '<span style="color:red">**[DEPRECATED]**</span><br/><br/>';
  return `${prop.deprecated ? deprecatedText : ''}${prop.documentation}`;
}

export function propsToMarkdown(props: PropMeta[]): string[] {
  const content: string[] = [];

  if (props.length === 0) return content;

  content.push('## Properties');
  content.push('');

  const table = new MarkdownTable();

  table.addHeader(['Property', 'Description', 'Type', 'Default']);

  props
    .filter(prop => !prop.internal)
    .forEach(prop => {
      table.addRow([
        getPropertyColumn(prop),
        getDescriptionColumn(prop),
        `\`${prop.typeInfo.resolved}\``,
        prop.defaultValue && prop.defaultValue.length > 0
          ? `\`${prop.defaultValue}\``
          : '',
      ]);
    });

  content.push(...table.toMarkdown());
  content.push('');
  content.push('');

  return content;
}
