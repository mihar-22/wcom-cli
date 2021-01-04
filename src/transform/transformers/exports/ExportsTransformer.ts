import { writeFile, ensureFile } from 'fs-extra';
import { resolveRelativePath } from '../../../core/resolve';
import { dashToPascalCase } from '../../../utils/string';
import { Transformer } from '../../Transformer';
import { ExportsTransformerConfig } from './ExportsTransformerConfig';

export const ExportsTransformer: Transformer<ExportsTransformerConfig> = {
  async transform(components, config) {
    const { exportsOutFile } = config;
    const output: string[] = [];

    components.forEach((component) => {
      const { className, tagName } = component;

      const exportPath = resolveRelativePath(
        exportsOutFile,
        component.source.filePath,
      ).replace('.ts', '');

      output.push(
        `export { ${className} as ${dashToPascalCase(tagName)} } from '${exportPath}';`,
      );
    });

    await ensureFile(exportsOutFile);
    await writeFile(exportsOutFile, `${output.join('\n')}\n`);
  },
};
