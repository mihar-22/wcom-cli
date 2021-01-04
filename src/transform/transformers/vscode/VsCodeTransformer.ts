import { resolve } from 'path';
import { writeFile, ensureFile } from 'fs-extra';
import { Transformer } from '../../Transformer';
import { VsCodeTransformerConfig } from './VsCodeTransformerConfig';

export const VsCodeTransformer: Transformer<VsCodeTransformerConfig> = {
  async transform(components, config) {
    const { cwd, vscodeOutFile } = config;
    const targetPath = resolve(cwd, vscodeOutFile);

    // ...

    await ensureFile(targetPath);
    await writeFile(targetPath, '');
  },
};
