import { resolve } from 'path';
import { writeFile, ensureFile } from 'fs-extra';
import { Transformer } from '../../Transformer';
import { TypesTransformerConfig } from './TypesTransformerConfig';

export const TypesTransformer: Transformer<TypesTransformerConfig> = {
  async transform(components, config) {
    const { cwd, typesOutFile } = config;
    const targetPath = resolve(cwd, typesOutFile);

    // ...

    await ensureFile(targetPath);
    await writeFile(targetPath, '');
  },
};
