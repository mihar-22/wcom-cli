import { resolve } from 'path';
import { writeFile, ensureFile } from 'fs-extra';
import { deepFilterObjectKeys } from '../../../utils/object';
import { Transformer } from '../../Transformer';
import { JsonTransformerConfig } from './JsonTransformerConfig';

export const JsonTransformer: Transformer<JsonTransformerConfig> = {
  async transform(components, config) {
    const { cwd, jsonOutFile } = config;
    const targetPath = resolve(cwd, jsonOutFile);

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

    await ensureFile(targetPath);
    await writeFile(targetPath, JSON.stringify(output, undefined, 2));
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
