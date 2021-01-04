import { writeFile, ensureFile } from 'fs-extra';
import { deepFilterObjectKeys } from '../../../utils/object';
import { Transformer } from '../../Transformer';
import { JsonTransformerConfig } from './JsonTransformerConfig';

export const JsonTransformer: Transformer<JsonTransformerConfig> = {
  async transform(components, config) {
    const { jsonOutFile } = config;

    const output: any = {
      noOfComponents: components.length,
      components: [],
    };

    components
      .map((component) => ({
        ...component,
        dependencies: component.dependencies.map((c) => c.tagName),
        dependents: component.dependents.map((c) => c.tagName),
      }))
      .map((component) => deepFilterObjectKeys(component, IGNORE_KEYS))
      .forEach((component) => { output.components.push(component); });

    await ensureFile(jsonOutFile);
    await writeFile(jsonOutFile, JSON.stringify(output, undefined, 2));
  },
};

type IgnoredKeys = 'symbol'
| 'declaration'
| 'decorator'
| 'type'
| 'node'
| 'file'
| 'signature'
| 'returnType';

const IGNORE_KEYS = new Set<IgnoredKeys>([
  'symbol',
  'declaration',
  'decorator',
  'type',
  'node',
  'file',
  'signature',
  'returnType',
]);
