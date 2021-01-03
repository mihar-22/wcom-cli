import { EventMeta } from '../../../../discover/ComponentMeta';
import { MarkdownTable } from './markdown-utils';

const getDescriptionColumn = (event: EventMeta) => {
  const deprecatedText = '<span style="color:red">**[DEPRECATED]**</span><br/><br/>';
  return `${event.deprecated ? deprecatedText : ''}${event.documentation}`;
};

export const eventsToMarkdown = (events: EventMeta[]) => {
  const content: string[] = [];

  if (events.length === 0) return content;

  content.push('## Events');
  content.push('');

  const table = new MarkdownTable();

  table.addHeader(['Event', 'Description', 'Type']);

  events.forEach((event) => {
    table.addRow([
      `\`${event.name}\``,
      getDescriptionColumn(event),
      `\`CustomEvent<${event.typeInfo.resolved}>\``,
    ]);
  });

  content.push(...table.toMarkdown());
  content.push('');
  content.push('');

  return content;
};
