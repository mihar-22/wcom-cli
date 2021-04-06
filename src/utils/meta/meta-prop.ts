import {
  GetAccessorDeclaration,
  Identifier,
  isPropertyDeclaration,
  isPropertySignature,
  ParameterDeclaration,
  PropertyDeclaration,
  PropertySignature,
  SyntaxKind,
  Type,
  TypeChecker,
} from 'typescript';

import { PropMeta, PropTypeInfo } from '../../plugins/ComponentMeta';
import {
  getDeclarationParameters,
  isDecoratorNamed,
} from '../../utils/decorators';
import { LogLevel, reportDiagnosticByNode } from '../../utils/log';
import { isMemberPrivate } from '../../utils/members';
import { camelCaseToDashCase } from '../../utils/string';
import { isUndefined } from '../../utils/unit';
import { getDocumentation } from './meta-doc';
import { findDocTag, getDocTags, hasDocTag } from './meta-doc-tag';
import {
  getTypeReferences,
  resolveType,
  typeTextFromTSType,
  typeToString,
} from './meta-type';

export interface DefaultPropOptions {
  attribute?: string;
  reflect?: boolean;
}

export function buildPropMetaFromDeclarationOrSignature<T>(
  checker: TypeChecker,
  declaration: PropertyDeclaration | GetAccessorDeclaration | PropertySignature,
  propDecoratorName = '',
  internalPropDecoratorName = '',
  transformPropOptions?: (propOptions: T) => DefaultPropOptions,
): PropMeta {
  const prop: Partial<PropMeta> = {};
  const identifier = declaration.name as Identifier;
  const symbol = checker.getSymbolAtLocation(identifier)!;
  const type = checker.getTypeAtLocation(declaration);
  const name = symbol.escapedName as string;
  const isProperty =
    isPropertyDeclaration(declaration) || isPropertySignature(declaration);
  const decorator = declaration.decorators?.find(
    isDecoratorNamed(propDecoratorName),
  );
  const decoratorParams = decorator
    ? getDeclarationParameters<T>(decorator)
    : undefined;
  const propOptions = decoratorParams?.[0] as T | undefined;
  const hasSetter = !isProperty ? symbol.declarations.length > 1 : undefined;
  const isStatic =
    declaration.modifiers?.some(m => m.kind === SyntaxKind.StaticKeyword) ??
    false;

  if (isProperty && isMemberPrivate(declaration)) {
    reportDiagnosticByNode(
      [
        `Property \`${name}\` cannot be \`private\` or \`protected\`. Use the`,
        `\`@${internalPropDecoratorName}()\` decorator instead.`,
      ].join('\n'),
      declaration,
      LogLevel.Warn,
    );
  }

  const typeText = typeTextFromTSType(type);

  // Prop can have an attribute if type is NOT "unknown".
  if (
    (typeText !== 'unknown' || (!isProperty && hasSetter)) &&
    !isUndefined(propOptions) &&
    !isUndefined(transformPropOptions)
  ) {
    const { attribute, reflect } = transformPropOptions(propOptions);
    prop.attribute = attribute?.trim().toLowerCase();
    prop.reflect = reflect ?? false;
  }

  prop.node = declaration;
  prop.name = name;
  prop.typeText = typeText;
  prop.static = isStatic;
  prop.typeInfo = getPropTypeInfo(checker, declaration, type);
  prop.documentation = getDocumentation(checker, identifier);
  prop.docTags = getDocTags(declaration);

  prop.readonly =
    (!isProperty && !hasSetter) ||
    (!hasSetter && hasDocTag(prop.docTags, 'readonly'));

  prop.attribute = !prop.readonly
    ? prop.attribute ?? camelCaseToDashCase(name)
    : findDocTag(prop.docTags, 'attribute')?.text;

  prop.internal = hasDocTag(prop.docTags, 'internal');
  prop.deprecated = hasDocTag(prop.docTags, 'deprecated');

  prop.required =
    !isUndefined((declaration as PropertyDeclaration).exclamationToken) ||
    hasDocTag(prop.docTags, 'required');

  prop.optional =
    !isUndefined(declaration.questionToken) ||
    hasDocTag(prop.docTags, 'optional');

  prop.defaultValue = isPropertyDeclaration(declaration)
    ? declaration.initializer?.getText()
    : findDocTag(prop.docTags, 'default')?.text;

  prop.defaultValue = prop.defaultValue ?? (prop.optional ? 'undefined' : '');

  return prop as PropMeta;
}

export function getPropTypeInfo(
  typeChecker: TypeChecker,
  node:
    | PropertyDeclaration
    | ParameterDeclaration
    | PropertySignature
    | GetAccessorDeclaration
    | Identifier,
  type: Type,
): PropTypeInfo {
  const nodeType = (node as PropertyDeclaration).type;

  return {
    original: nodeType ? nodeType.getText() : typeToString(typeChecker, type),
    resolved: resolveType(typeChecker, type),
    references: getTypeReferences(node),
  };
}
