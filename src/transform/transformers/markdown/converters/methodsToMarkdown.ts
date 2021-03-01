import { MethodMeta } from '../../../../discover/ComponentMeta';
import { MarkdownTable } from './markdownUtils';

const getNameColumn = (method: MethodMeta): string => `\`${method.name}\``;

const getDescriptionColumn = (method: MethodMeta): string => {
  const deprecatedText =
    '<span style="color:red">**[DEPRECATED]**</span><br/><br/>';
  return `${method.deprecated ? deprecatedText : ''}${method.documentation}`;
};

const getSignatureColumn = (method: MethodMeta): string =>
  `\`${method.typeInfo.signatureText}\``;

export const methodsToMarkdown = (methods: MethodMeta[]): string[] => {
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
        getNameColumn(method),
        getDescriptionColumn(method),
        getSignatureColumn(method),
      ]);
    });

  content.push(...table.toMarkdown());
  content.push('');
  content.push('');

  return content;
};
