import { ensureFile, writeFile } from 'fs-extra';

import { JsonTransformerConfig } from '../../../cli/commands/transform/TransformCommandConfig';
import { deepFilterObjectKeys } from '../../../utils/object';
import { Transformer } from '../../Transformer';

export const JsonTransformer: Transformer<JsonTransformerConfig> = {
  async transform(components, config) {
    const { jsonOutFile } = config;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const output: any = {
      noOfComponents: components.length,
      components: [],
    };

    components
      .map(component => ({
        ...component,
        dependencies: component.dependencies.map(c => c.tagName),
        dependents: component.dependents.map(c => c.tagName),
      }))
      .map(component => deepFilterObjectKeys(component, IGNORE_KEYS))
      .forEach(component => {
        output.components.push(component);
      });

    await ensureFile(jsonOutFile);
    await writeFile(jsonOutFile, JSON.stringify(output, undefined, 2));
  },
};

type IgnoredKeys =
  | 'symbol'
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
