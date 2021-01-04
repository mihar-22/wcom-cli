import { MethodMeta } from '../../../../discover/ComponentMeta';
import { MarkdownTable } from './markdown-utils';

const getNameColumn = (method: MethodMeta) => `\`${method.name}\``;

const getDescriptionColumn = (method: MethodMeta) => {
  const deprecatedText = '<span style="color:red">**[DEPRECATED]**</span><br/><br/>';
  return `${method.deprecated ? deprecatedText : ''}${method.documentation}`;
};

const getSignatureColumn = (method: MethodMeta) => `\`${method.typeInfo.signatureText}\``;

export const methodsToMarkdown = (methods: MethodMeta[]) => {
  const content: string[] = [];

  if (methods.length === 0) return content;

  content.push('## Methods');
  content.push('');

  const table = new MarkdownTable();

  table.addHeader(['Method', 'Description', 'Signature']);

  methods
    .filter((method) => !method.internal)
    .forEach((method) => {
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
