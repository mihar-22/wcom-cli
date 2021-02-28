/* eslint-disable no-bitwise, no-case-declarations */

import {
  ArrayLiteralExpression,
  ComputedPropertyName,
  Expression,
  Identifier,
  isNumericLiteral,
  isPropertyAssignment,
  isShorthandPropertyAssignment,
  isStringLiteral,
  LiteralExpression,
  ObjectLiteralExpression,
  PropertyName,
  StringLiteral,
  SyntaxKind,
  ClassElement,
  TypeFormatFlags,
  TypeChecker,
  Type,
  UnionType,
  VisitResult,
  isTypeReferenceNode,
  TypeReferenceNode,
  forEachChild,
  isIdentifier,
  isNamedExports,
  isExportDeclaration,
  isInterfaceDeclaration,
  isTypeAliasDeclaration,
  ImportDeclaration,
  isImportClause,
  isNamedImports,
  isImportDeclaration,
  Node,
  EntityName,
  displayPartsToString,
  SourceFile,
} from 'typescript';
import { normalizeLineBreaks } from '../../utils/string';
import { DocTag, TypeReference, TypeReferences } from '../ComponentMeta';

export const splitJsDocTagText = (tag: DocTag) => {
  const [title, description] = (tag.text?.split(':') ?? []).map(s => s.trim());
  return { title, description, node: tag.node };
};

export const getDocTags = (node: Node): DocTag[] =>
  ((node as any).jsDoc?.[0]?.tags ?? []).map((docTagNode: any) => ({
    node: docTagNode,
    name: docTagNode.tagName.escapedText,
    text: docTagNode.comment,
  }));

export const hasDocTag = (tags: DocTag[], name: string) =>
  tags.some(tag => tag.name === name);

export const getDocumentation = (checker: TypeChecker, id: Identifier) => {
  const comment = checker
    .getSymbolAtLocation(id)
    ?.getDocumentationComment(checker);
  return normalizeLineBreaks(displayPartsToString(comment) ?? '');
};

export const resolveType = (checker: TypeChecker, type: Type) => {
  const set = new Set<string>();
  parseDocsType(checker, type, set);

  // Normalize booleans.
  const hasTrue = set.delete('true');
  const hasFalse = set.delete('false');

  if (hasTrue || hasFalse) {
    set.add('boolean');
  }

  let parts = Array.from(set.keys()).sort();

  if (parts.length > 1) {
    parts = parts.map(p => (p.indexOf('=>') >= 0 ? `(${p})` : p));
  }

  if (parts.length > 20) {
    return typeToString(checker, type);
  }

  return parts.join(' | ');
};

export const parseDocsType = (
  checker: TypeChecker,
  type: Type,
  parts: Set<string>,
) => {
  if (type.isUnion()) {
    (type as UnionType).types.forEach(t => {
      parseDocsType(checker, t, parts);
    });
  } else {
    const text = typeToString(checker, type);
    parts.add(text);
  }
};

export const typeToString = (checker: TypeChecker, type: Type) => {
  const TYPE_FORMAT_FLAGS =
    TypeFormatFlags.NoTruncation |
    TypeFormatFlags.InTypeAlias |
    TypeFormatFlags.InElementType;

  return checker.typeToString(type, undefined, TYPE_FORMAT_FLAGS);
};

export const isMemberPrivate = (member: ClassElement) =>
  member.modifiers &&
  member.modifiers.some(
    m =>
      m.kind === SyntaxKind.PrivateKeyword ||
      m.kind === SyntaxKind.ProtectedKeyword,
  );

const getTextOfPropertyName = (propName: PropertyName) => {
  switch (propName.kind) {
    case SyntaxKind.Identifier:
      return (<Identifier>propName).text;
    case SyntaxKind.StringLiteral:
    case SyntaxKind.NumericLiteral:
      return (<LiteralExpression>propName).text;
    case SyntaxKind.ComputedPropertyName:
      const { expression } = <ComputedPropertyName>propName;
      if (isStringLiteral(expression) || isNumericLiteral(expression)) {
        return (<LiteralExpression>(<ComputedPropertyName>propName).expression)
          .text;
      }
  }

  return undefined;
};

export const getTypeReferences = (node: Node, sourceFile?: SourceFile) => {
  const allReferences: TypeReferences = {};

  getAllTypeReferences(node).forEach(typeRef => {
    allReferences[typeRef] = getTypeReferenceLocation(
      typeRef,
      sourceFile ?? node.getSourceFile(),
    );
  });

  return allReferences;
};

const getEntityName = (entity: EntityName): string => {
  if (isIdentifier(entity)) {
    return entity.escapedText.toString();
  }

  return getEntityName(entity.left);
};

const getAllTypeReferences = (rootNode: Node) => {
  const referencedTypes: string[] = [];

  const visit = (node: Node): VisitResult<Node> => {
    if (isTypeReferenceNode(node)) {
      referencedTypes.push(getEntityName(node.typeName));

      node.typeArguments
        ?.filter(ta => isTypeReferenceNode(ta))
        .forEach(tr => {
          const typeName = (tr as TypeReferenceNode).typeName as Identifier;
          if (typeName && typeName.escapedText) {
            referencedTypes.push(typeName.escapedText.toString());
          }
        });
    }

    return forEachChild(node, visit);
  };

  visit(rootNode);

  return referencedTypes;
};

const getTypeReferenceLocation = (
  typeName: string,
  node: Node,
): TypeReference => {
  const sourceFile = node.getSourceFile();

  /**
   * Loop through all top level imports to find any reference to the type for 'import'
   * reference location
   */
  const importTypeDeclaration = sourceFile.statements.find(st => {
    const statement =
      isImportDeclaration(st) &&
      st.importClause &&
      isImportClause(st.importClause) &&
      st.importClause.namedBindings &&
      isNamedImports(st.importClause.namedBindings) &&
      Array.isArray(st.importClause.namedBindings.elements) &&
      st.importClause.namedBindings.elements.find(
        nbe => nbe.name.getText() === typeName,
      );

    return !!statement;
  }) as ImportDeclaration;

  if (importTypeDeclaration) {
    const localImportPath = (<StringLiteral>(
      importTypeDeclaration.moduleSpecifier
    )).text;
    return {
      location: 'import',
      path: localImportPath,
    };
  }

  /**
   * Loop through all top level exports to find if any reference to the type for
   * 'local' reference location
   */
  const isExported = sourceFile.statements.some(st => {
    // Is the interface defined in the file and exported.
    const isInterfaceDeclarationExported =
      isInterfaceDeclaration(st) &&
      (<Identifier>st.name).getText() === typeName &&
      Array.isArray(st.modifiers) &&
      st.modifiers.some(mod => mod.kind === SyntaxKind.ExportKeyword);

    const isTypeAliasDeclarationExported =
      isTypeAliasDeclaration(st) &&
      (<Identifier>st.name).getText() === typeName &&
      Array.isArray(st.modifiers) &&
      st.modifiers.some(mod => mod.kind === SyntaxKind.ExportKeyword);

    // Is the interface exported through a named export.
    const isTypeInExportDeclaration =
      isExportDeclaration(st) &&
      isNamedExports(st.exportClause!) &&
      st.exportClause.elements.some(nee => nee.name.getText() === typeName);

    return (
      isInterfaceDeclarationExported ||
      isTypeAliasDeclarationExported ||
      isTypeInExportDeclaration
    );
  });

  if (isExported) {
    return { location: 'local' };
  }

  /**
   * This is most likely a global type, if it is a local that is not exported then
   * typescript will inform the dev.
   */
  return { location: 'global' };
};

const getIdentifierValue = (escapedText: any) => {
  const identifier: ConvertIdentifier = {
    __identifier: true,
    __escapedText: escapedText,
  };

  return identifier;
};

export const arrayLiteralToArray = (arr: ArrayLiteralExpression) =>
  arr.elements.map(element => {
    let val: any;

    switch (element.kind) {
      case SyntaxKind.ObjectLiteralExpression:
        val = objectLiteralToObjectMap(element as ObjectLiteralExpression);
        break;

      case SyntaxKind.StringLiteral:
        val = (element as StringLiteral).text;
        break;

      case SyntaxKind.TrueKeyword:
        val = true;
        break;

      case SyntaxKind.FalseKeyword:
        val = false;
        break;

      case SyntaxKind.Identifier:
        const { escapedText } = element as Identifier;
        if (escapedText === 'String') {
          val = String;
        } else if (escapedText === 'Number') {
          val = Number;
        } else if (escapedText === 'Boolean') {
          val = Boolean;
        }
        break;

      case SyntaxKind.PropertyAccessExpression:
      default:
        val = element;
    }

    return val;
  });

export const objectLiteralToObjectMap = (
  objectLiteral: ObjectLiteralExpression,
) => {
  const { properties } = objectLiteral;
  const final: ObjectMap = {};

  for (const propAssignment of properties) {
    let val: any;
    const propName = getTextOfPropertyName(
      propAssignment.name as PropertyName,
    )!;

    if (isShorthandPropertyAssignment(propAssignment)) {
      val = getIdentifierValue(propName);
    } else if (isPropertyAssignment(propAssignment)) {
      switch (propAssignment.initializer.kind) {
        case SyntaxKind.ArrayLiteralExpression:
          val = arrayLiteralToArray(
            propAssignment.initializer as ArrayLiteralExpression,
          );
          break;

        case SyntaxKind.ObjectLiteralExpression:
          val = objectLiteralToObjectMap(
            propAssignment.initializer as ObjectLiteralExpression,
          );
          break;

        case SyntaxKind.StringLiteral:
          val = (propAssignment.initializer as StringLiteral).text;
          break;

        case SyntaxKind.NoSubstitutionTemplateLiteral:
          val = (propAssignment.initializer as StringLiteral).text;
          break;

        case SyntaxKind.TrueKeyword:
          val = true;
          break;

        case SyntaxKind.FalseKeyword:
          val = false;
          break;

        case SyntaxKind.Identifier:
          const { escapedText } = propAssignment.initializer as Identifier;
          if (escapedText === 'String') {
            val = String;
          } else if (escapedText === 'Number') {
            val = Number;
          } else if (escapedText === 'Boolean') {
            val = Boolean;
          } else if (escapedText === 'undefined') {
            val = undefined;
          } else if (escapedText === 'null') {
            val = null;
          } else {
            val = getIdentifierValue(
              (propAssignment.initializer as Identifier).escapedText,
            );
          }
          break;
        case SyntaxKind.PropertyAccessExpression:
        default:
          val = propAssignment.initializer;
      }
    }

    final[propName] = val;
  }

  return final;
};

export interface ConvertIdentifier {
  __identifier: boolean;
  __escapedText: string;
}

export class ObjectMap {
  [key: string]: Expression | ObjectMap;
}
