import { CssPropMeta } from '../../ComponentMeta';
import { MarkdownTable } from './markdown-utils';

export function cssPropsToMarkdown(cssProps: CssPropMeta[]): string[] {
  const content: string[] = [];

  if (cssProps.length === 0) return content;

  content.push('## CSS Custom Properties');
  content.push('');

  const table = new MarkdownTable();
  table.addHeader(['Name', 'Description']);

  cssProps.forEach(cssProp => {
    table.addRow([`\`${cssProp.name}\``, cssProp.description ?? '']);
  });

  content.push(...table.toMarkdown());
  content.push('');
  content.push('');

  return content;
}
