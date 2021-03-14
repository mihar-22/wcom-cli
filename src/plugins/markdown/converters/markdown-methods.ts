import { MethodMeta } from '../../ComponentMeta';
import { MarkdownTable } from './markdown-utils';

function getMethodColumn(method: MethodMeta): string {
  const staticText = method.static ? ' _(static)_' : '';
  return `\`${method.name}\`${staticText}`;
}

function getDescriptionColumn(method: MethodMeta): string {
  const deprecatedText =
    '<span style="color:red">**[DEPRECATED]**</span><br/><br/>';
  return `${method.deprecated ? deprecatedText : ''}${method.documentation}`;
}

const getSignatureColumn = (method: MethodMeta): string =>
  `\`${method.typeInfo.signatureText}\``;

export function methodsToMarkdown(methods: MethodMeta[]): string[] {
  const content: string[] = [];

  if (methods.length === 0) return content;

  content.push('## Methods');
  content.push('');

  const table = new MarkdownTable();

  table.addHeader(['Method', 'Description', 'Signature']);

  methods
    .filter(method => !method.internal)
    .forEach(method => {
      table.addRow([
        getMethodColumn(method),
        getDescriptionColumn(method),
        getSignatureColumn(method),
      ]);
    });

  content.push(...table.toMarkdown());
  content.push('');
  content.push('');

  return content;
}
