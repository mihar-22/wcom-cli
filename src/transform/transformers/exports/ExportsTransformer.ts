import { writeFile, ensureFile } from 'fs-extra';
import { resolveRelativePath } from '../../../core/resolve';
import { Transformer } from '../../Transformer';
import { ExportsTransformerConfig } from './ExportsTransformerConfig';

export const ExportsTransformer: Transformer<ExportsTransformerConfig> = {
  async transform(components, config) {
    const { exportsOutFile } = config;
    const output: string[] = [];

    components.forEach((component) => {
      const exportPath = resolveRelativePath(exportsOutFile, component.source.filePath);
      output.push(
        `export { ${component.className} } from '${exportPath.replace('.ts', '')}';`,
      );
    });

    await ensureFile(exportsOutFile);
    await writeFile(exportsOutFile, `${output.join('\n')}\n`);
  },
};
