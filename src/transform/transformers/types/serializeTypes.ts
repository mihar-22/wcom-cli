import normalizePath from 'normalize-path';
import { dirname, isAbsolute, relative } from 'path';
import {
  ComponentMeta, EventMeta, MethodMeta, PropMeta,
} from '../../../discover/ComponentMeta';
import { objectHasProperty } from '../../../utils/object';
import { dashToPascalCase, splitLineBreaks, upperCaseFirstChar } from '../../../utils/string';
import { isUndefined } from '../../../utils/unit';
import { resolveAliasForComponentMember, TypeImport } from './TypeImport';

export function serializeComponentsNamespace(components: ComponentMeta[], isDevMode: boolean) {
  return [
    'export namespace Components {',
    components.map((c) => serializeInterface(c, isDevMode)).join('\n\n'),
    '}',
  ].join('\n');
}

export function serializeGlobalDeclaration(components: ComponentMeta[]) {
  return [
    'declare global {',
    components.map((c) => serializeHTMLElement(c)).join('\n\n'),
    '',
    serializeHTMLElementTagNameMap(components),
    '',
    serializeHTMLEventMap(components),
    '}',
  ].join('\n');
}

export function serializeJSXModuleDeclaration(pkgName: string, components: ComponentMeta[]) {
  return [
    `declare module "${pkgName}" {`,
    '  export namespace JSX {',
    '    interface IntrinsicElements {',
    components.map((c) => {
      const name = dashToPascalCase(c.tagName);
      return `      "${c.tagName}": LocalJSX.${name} & HTMLAttributes<HTML${name}Element>;`;
    }).join('\n'),
    '    }',
    '  }',
    '}',
  ].join('\n');
}

export function serializeLocalJSXDeclaration(components: ComponentMeta[], isDevMode: boolean) {
  return [
    'declare namespace LocalJSX {',
    components.map((c) => serializeJSX(c, isDevMode)).join('\n\n'),
    '',
    '  interface IntrinsicElements {',
    components.map((c) => `    "${c.tagName}": ${dashToPascalCase(c.tagName)};`).join('\n'),
    '  }',
    '}',
    '',
    'export { LocalJSX as JSX };',
  ].join('\n');
}

function serializeHTMLElementTagNameMap(components: ComponentMeta[]) {
  const tags = components
    .map((c) => `    "${c.tagName}": HTML${dashToPascalCase(c.tagName)}Element;`)
    .join('\n');

  return [
    '  interface HTMLElementTagNameMap {',
    tags,
    '  }',
  ].join('\n');
}

export function serializeHTMLEventMap(components: ComponentMeta[]) {
  const events = components
    .flatMap((component) => component.events)
    .map((event) => `    "${event.name}": CustomEvent<${event.typeInfo.resolved}>;`)
    .join('\n');

  return [
    '  interface HTMLElementEventMap {',
    events,
    '  }',
  ].join('\n');
}

export function serializeInterface(component: ComponentMeta, isDevMode: boolean) {
  const name = dashToPascalCase(component.tagName);
  const members = serializeComponentMembers(component, false, isDevMode);
  return `  interface ${name} {\n${members}  }`;
}

export function serializeHTMLElement(component: ComponentMeta) {
  const name = dashToPascalCase(component.tagName);
  const htmlElementName = `HTML${name}Element`;
  return [
    `  interface ${htmlElementName} extends Components.${name}, HTMLElement {}`,
    `  var ${htmlElementName}: {`,
    `    prototype: ${htmlElementName};`,
    `    new (): ${htmlElementName};`,
    '  };',
  ].join('\n');
}

export function serializeJSX(component: ComponentMeta, isDevMode: boolean) {
  const name = dashToPascalCase(component.tagName);
  const members = serializeComponentMembers(component, true, isDevMode);
  return `  interface ${name} {\n${members}  }`;
}

export function serializeTypeImports(targetPath: string, typeImports: TypeImport[]) {
  const typeImportsGroupedByFilePath = typeImports
    .reduce((prevImports, typeImport) => ({
      ...prevImports,
      [typeImport.path]: [
        ...(prevImports[typeImport.path] ?? []),
        typeImport,
      ],
    }), {} as Record<string, TypeImport[]>);

  return Object.keys(typeImportsGroupedByFilePath)
    .map((filePath) => {
      const importPath = isAbsolute(filePath)
        ? normalizePath(`./${relative(dirname(targetPath), filePath)}`).replace('.ts', '')
        : filePath;

      const fileTypeImports = typeImportsGroupedByFilePath[filePath];

      return `import { ${fileTypeImports
        .map((typeImport) => (isUndefined(typeImport.alias)
          ? typeImport.name
          : `${typeImport.name} as ${typeImport.alias}`))
        .join(', ')} } from "${importPath}";`;
    })
    .join('\n');
}

function serializeComponentMembers(
  component: ComponentMeta,
  isJSX: boolean,
  isDevMode: boolean,
) {
  const members = (isJSX
    ? [...component.props, ...component.events]
    : [...component.props, ...component.methods]) as (PropMeta | MethodMeta | EventMeta)[];

  const membersText = members
    .filter((meta) => isDevMode || !meta.internal)
    .reduce((serializedMembers, meta) => {
      if ((meta.documentation?.length ?? 0) > 0 || meta.docTags.length > 0) {
        serializedMembers.push('    /**');
        serializedMembers.push(
          ...splitLineBreaks(meta.documentation ?? '')
            .map((line) => `     * ${line}`),
        );
        serializedMembers.push(
          ...meta.docTags
            .map((tag) => `     * @${tag.name}${tag.text ? ` ${tag.text}` : ''}`),
        );
        serializedMembers.push('     */');
      }

      const isEvent = objectHasProperty(meta as EventMeta, 'bubbles');
      const name = (isJSX && isEvent) ? `on${upperCaseFirstChar(meta.name)}` : meta.name;
      const optional = isJSX ? !(meta as PropMeta).required : (meta as PropMeta).optional;
      const aliasedType = resolveAliasForComponentMember(component, meta.typeInfo);
      const type = (isJSX && isEvent) ? `(event: CustomEvent<${aliasedType}>) => void` : aliasedType;

      serializedMembers.push(`    "${name}"${optional ? '?' : ''}: ${type};`);

      return serializedMembers;
    }, [] as string[])
    .join('\n');

  return membersText !== '' ? `${membersText}\n` : '';
}
