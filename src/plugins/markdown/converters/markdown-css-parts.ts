import { CssPartMeta } from '../../ComponentMeta';
import { MarkdownTable } from './markdown-utils';

export function cssPartsToMarkdown(cssParts: CssPartMeta[]): string[] {
  const content: string[] = [];

  if (cssParts.length === 0) return content;

  content.push('## CSS Parts');
  content.push('');

  const table = new MarkdownTable();
  table.addHeader(['Name', 'Description']);

  cssParts.forEach(cssPart => {
    table.addRow([`\`${cssPart.name}\``, cssPart.description ?? '']);
  });

  content.push(...table.toMarkdown());
  content.push('');
  content.push('');

  return content;
}
