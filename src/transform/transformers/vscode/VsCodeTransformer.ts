import { writeFile, ensureFile } from 'fs-extra';
import { Transformer } from '../../Transformer';
import { VsCodeTransformerConfig } from './VsCodeTransformerConfig';
import { escapeQuotes } from '../../../utils/string';

export const VsCodeTransformer: Transformer<VsCodeTransformerConfig> = {
  async transform(components, config) {
    const { vscodeOutFile } = config;

    const output: HTMLDataV1 = {
      version: 1.1,
      tags: [],
    };

    components.forEach((component) => {
      output.tags!.push({
        name: component.tagName,
        description: component.documentation,
        attributes: component.props
          .filter((prop) => !!prop.attribute && !prop.readonly && !prop.internal)
          .map((prop) => ({
            name: prop.attribute,
            description: prop.documentation,
            values: (['string', 'number'].includes(prop.typeText) && prop.typeInfo.original.includes('|'))
              ? prop.typeInfo.original.split('|').map((v) => ({ name: escapeQuotes(v.trim()) }))
              : undefined,
          })),
      });
    });

    await ensureFile(vscodeOutFile);
    await writeFile(vscodeOutFile, JSON.stringify(output, undefined, 2));
  },
};

/**
 * https://github.com/microsoft/vscode-html-languageservice/blob/master/src/htmlLanguageTypes.ts#L164
 */

interface IReference {
  name: string;
  url: string;
}

interface ITagData {
  name: string;
  description?: string;
  attributes: IAttributeData[];
  references?: IReference[];
}

interface IAttributeData {
  name: string;
  description?: string;
  valueSet?: string;
  values?: IValueData[];
  references?: IReference[];
}

interface IValueData {
  name: string;
  description?: string;
  references?: IReference[];
}

interface IValueSet {
  name: string;
  values: IValueData[];
}

interface HTMLDataV1 {
  version: 1 | 1.1;
  tags?: ITagData[];
  globalAttributes?: IAttributeData[];
  valueSets?: IValueSet[];
}
