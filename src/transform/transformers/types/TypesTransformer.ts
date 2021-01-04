import { writeFile, ensureFile } from 'fs-extra';
import { Transformer } from '../../Transformer';
import { TypesTransformerConfig } from './TypesTransformerConfig';

export const TypesTransformer: Transformer<TypesTransformerConfig> = {
  async transform(components, config) {
    const { typesOutFile } = config;

    // ...

    await ensureFile(typesOutFile);
    await writeFile(typesOutFile, '');
  },
};
