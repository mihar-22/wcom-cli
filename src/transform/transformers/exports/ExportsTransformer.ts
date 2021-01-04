import { writeFile, ensureFile } from 'fs-extra';
import { resolve } from 'path';
import { resolveRelativePath } from '../../../core/resolve';
import { Transformer } from '../../Transformer';
import { ExportsTransformerConfig } from './ExportsTransformerConfig';

export const ExportsTransformer: Transformer<ExportsTransformerConfig> = {
  async transform(components, config) {
    const { cwd, exportsOutFile } = config;
    const output: string[] = [];
    const targetPath = resolve(cwd, exportsOutFile);

    components.forEach((component) => {
      const exportPath = resolveRelativePath(targetPath, component.source.filePath);
      output.push(
        `export { ${component.className} } from '${exportPath.replace('.ts', '')}';`,
      );
    });

    await ensureFile(targetPath);
    await writeFile(targetPath, `${output.join('\n')}\n`);
  },
};
