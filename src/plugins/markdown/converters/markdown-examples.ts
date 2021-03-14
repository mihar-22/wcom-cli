import { DocTagMeta } from '../../ComponentMeta';

export function examplesToMarkdown(docTags: DocTagMeta[]): string[] {
  const content: string[] = [];

  const examples = docTags.filter(tag => tag.name === 'example');

  if (examples.length === 0) return content;

  content.push('## Examples');
  content.push('');

  examples.forEach(example => {
    content.push(example.text ?? '');
    content.push('');
  });

  return content;
}
