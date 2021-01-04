import { writeFile, ensureFile, pathExists } from 'fs-extra';
import normalizePath from 'normalize-path';
import { dirname, resolve } from 'path';
import { Transformer } from '../../Transformer';
import { jsxTypes } from './jsx';
import {
  serializeComponentsNamespace,
  serializeGlobalDeclaration,
  serializeJSXModuleDeclaration,
  serializeLocalJSXDeclaration,
  serializeTypeImports,
} from './serializeTypes';
import { clearTypeImportInfo, findTypeImports } from './TypeImport';
import { TypesTransformerConfig } from './TypesTransformerConfig';

export const TypesTransformer: Transformer<TypesTransformerConfig> = {
  async transform(components, config) {
    const { typesOutFile, pkgName, watch } = config;
    const isDevMode = watch;
    const typeImports = components.flatMap((component) => findTypeImports(component));

    await copyJSXTypes(typesOutFile);

    const output = [
      HEADER,
      "import { HTMLAttributes } from './jsx';",
      serializeTypeImports(typesOutFile, typeImports),
      '',
      serializeComponentsNamespace(components, isDevMode),
      '',
      serializeGlobalDeclaration(components),
      '',
      serializeLocalJSXDeclaration(components, isDevMode),
      '',
      serializeJSXModuleDeclaration(pkgName, components),
      '',
    ];

    await ensureFile(typesOutFile);
    await writeFile(typesOutFile, output.join('\n'));

    clearTypeImportInfo();
  },
};

async function copyJSXTypes(typesOutFile: string) {
  const targetPath = normalizePath(resolve(dirname(typesOutFile), 'jsx.d.ts'));
  if (await pathExists(targetPath)) return;
  await ensureFile(targetPath);
  await writeFile(targetPath, jsxTypes);
}

const HEADER = [
  '/* eslint-disable */',
  '/* tslint:disable */',
  `
/**
 * This is an autogenerated file created by \`@wcom/cli\`. It contains type information
 * for all components that exist in this project.
 */
  `,
].join('\n');
