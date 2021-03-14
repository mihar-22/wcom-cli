import { EventMeta } from '../../ComponentMeta';
import { MarkdownTable } from './markdown-utils';

function getDescriptionColumn(event: EventMeta): string {
  const deprecatedText =
    '<span style="color:red">**[DEPRECATED]**</span><br/><br/>';
  return `${event.deprecated ? deprecatedText : ''}${event.documentation}`;
}

export function eventsToMarkdown(events: EventMeta[]): string[] {
  const content: string[] = [];

  if (events.length === 0) return content;

  content.push('## Events');
  content.push('');

  const table = new MarkdownTable();

  table.addHeader(['Event', 'Description', 'Type']);

  events
    .filter(event => !event.internal)
    .forEach(event => {
      table.addRow([
        `\`${event.name}\``,
        getDescriptionColumn(event),
        `\`${event.typeInfo.resolved}\``,
      ]);
    });

  content.push(...table.toMarkdown());
  content.push('');
  content.push('');

  return content;
}
