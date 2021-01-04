import { dirname, resolve } from 'path';
import {
  ComponentMeta, MethodTypeInfo, PropTypeInfo, TypeReference,
} from '../../../discover/ComponentMeta';
import { isUndefined } from '../../../utils/unit';

// Keeps track of the number of times a type is imported into the global types file.
const globalTypeImportCount = new Map<string, number>();

// Keep track of type imports per component (key is component.tagName).
const componentTypeImports = new Map<string, TypeImport[]>();

// Keep track of type imports (path:name) that have already been imported.
const seenTypes = new Set<string>();

export interface TypeImport {
  name: string;
  alias?: string;
  path: string;
}

export function resolveTypeImportPath(type: TypeReference, sourceFilePath: string) {
  const importPath = (type.location === 'local') ? sourceFilePath : type.path!;
  // If this is a relative path make it absolute.
  return importPath.startsWith('.') ? resolve(dirname(sourceFilePath), importPath) : importPath;
}

export function clearTypeImportInfo() {
  globalTypeImportCount.clear();
  componentTypeImports.clear();
  seenTypes.clear();
}

export function aliasTypeName(typeImport: TypeImport) {
  const count = globalTypeImportCount.get(typeImport.name);

  if (isUndefined(count)) {
    globalTypeImportCount.set(typeImport.name, 1);
    return undefined;
  }

  globalTypeImportCount.set(typeImport.name, count + 1);
  return `${typeImport.name}$${count}`;
}

export function findTypeImports(component: ComponentMeta): TypeImport[] {
  const typeImports = ([...component.props, ...component.methods, ...component.events])
    .filter((prop) => prop.typeInfo?.references)
    .map((prop) => prop.typeInfo.references)
    .flatMap((references) => Object.keys(references).map((name) => ({
      ...references[name],
      name,
    })))
    .filter((type) => type.location !== 'global')
    .map((type) => ({
      ...type,
      path: resolveTypeImportPath(type, component.source.filePath),
    }))
    .filter(({ path, name }) => {
      const typeKey = `${path}:${name}`;
      if (seenTypes.has(typeKey)) return false;
      seenTypes.add(typeKey);
      return true;
    })
    .map((type) => ({
      ...type,
      alias: aliasTypeName(type),
    }));

  componentTypeImports.set(component.tagName, typeImports);
  return typeImports;
}

export function resolveAliasForComponentMember(
  component: ComponentMeta,
  typeInfo: PropTypeInfo | MethodTypeInfo,
) {
  let type = (typeInfo as PropTypeInfo).original ?? (typeInfo as MethodTypeInfo).signatureText;

  const typeImports = (componentTypeImports.get(component.tagName) ?? [])
    .filter((typeImport) => !isUndefined(typeImport.alias));

  for (const typeImport of typeImports) {
    type = type.replace(typeImport.name, typeImport.alias!);
  }

  return type;
}
