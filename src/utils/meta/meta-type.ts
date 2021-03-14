/* eslint-disable no-bitwise, no-case-declarations */
import {
  ArrayLiteralExpression,
  ComputedPropertyName,
  EntityName,
  Expression,
  forEachChild,
  Identifier,
  ImportDeclaration,
  isExportDeclaration,
  isIdentifier,
  isImportClause,
  isImportDeclaration,
  isInterfaceDeclaration,
  isNamedExports,
  isNamedImports,
  isNumericLiteral,
  isPropertyAssignment,
  isShorthandPropertyAssignment,
  isStringLiteral,
  isTypeAliasDeclaration,
  isTypeReferenceNode,
  LiteralExpression,
  NamedExportBindings,
  NamedExports,
  Node,
  ObjectLiteralExpression,
  PropertyName,
  SourceFile,
  StringLiteral,
  SyntaxKind,
  Type,
  TypeChecker,
  TypeFlags,
  TypeFormatFlags,
  TypeReferenceNode,
  UnionType,
  VisitResult,
} from 'typescript';

import {
  TypeReference,
  TypeReferences,
  TypeText,
} from '../../plugins/ComponentMeta';

export function getTypeSourceFile(type: Type): SourceFile {
  const declarations =
    type.aliasSymbol?.getDeclarations() ?? type.getSymbol()!.getDeclarations();
  return declarations![0].getSourceFile();
}

export function resolveType(checker: TypeChecker, type: Type): string {
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
}

export function parseDocsType(
  checker: TypeChecker,
  type: Type,
  parts: Set<string>,
): void {
  if (type.isUnion()) {
    (type as UnionType).types.forEach(t => {
      parseDocsType(checker, t, parts);
    });
  } else {
    const text = typeToString(checker, type);
    parts.add(text);
  }
}

export function typeToString(checker: TypeChecker, type: Type): string {
  const TYPE_FORMAT_FLAGS =
    TypeFormatFlags.NoTruncation |
    TypeFormatFlags.InTypeAlias |
    TypeFormatFlags.InElementType;

  return checker.typeToString(type, undefined, TYPE_FORMAT_FLAGS);
}

function getTextOfPropertyName(propName: PropertyName): string | undefined {
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
}

export function getTypeReferences(
  node: Node,
  sourceFile?: SourceFile,
): TypeReferences {
  const allReferences: TypeReferences = {};

  getAllTypeReferences(node).forEach(typeRef => {
    allReferences[typeRef] = getTypeReferenceLocation(
      typeRef,
      sourceFile ?? node.getSourceFile(),
    );
  });

  return allReferences;
}

function getEntityName(entity: EntityName): string {
  if (isIdentifier(entity)) {
    return entity.escapedText.toString();
  }

  return getEntityName(entity.left);
}

function getAllTypeReferences(rootNode: Node): string[] {
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

    if (isIdentifier(node)) {
      referencedTypes.push(node.escapedText.toString());
    }

    return forEachChild(node, visit);
  };

  visit(rootNode);

  return referencedTypes;
}

function getTypeReferenceLocation(typeName: string, node: Node): TypeReference {
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
    // Is the interface defined in the file and exported?
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

    // Is the interface exported through a named export?
    const isTypeInExportDeclaration =
      isExportDeclaration(st) &&
      isNamedExports(st.exportClause as NamedExportBindings) &&
      ((st.exportClause as NamedExports)?.elements.some(
        nee => nee.name.getText() === typeName,
      ) ??
        false);

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
}

function getIdentifierValue(escapedText: string): ConvertIdentifier {
  return {
    __identifier: true,
    __escapedText: escapedText,
  };
}

export function arrayLiteralToArray(arr: ArrayLiteralExpression): unknown[] {
  return arr.elements.map(element => {
    let val: unknown;

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
}

export function objectLiteralToObjectMap(
  objectLiteral: ObjectLiteralExpression,
): ObjectMap {
  const { properties } = objectLiteral;
  const final: ObjectMap = {};

  for (const propAssignment of properties) {
    let val: unknown;

    const propName = getTextOfPropertyName(
      propAssignment.name as PropertyName,
    ) as string;

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
              (propAssignment.initializer as Identifier).escapedText as string,
            );
          }
          break;
        case SyntaxKind.PropertyAccessExpression:
        default:
          val = propAssignment.initializer;
      }
    }

    final[propName] = val as Expression | ObjectMap;
  }

  return final;
}

export interface ConvertIdentifier {
  __identifier: boolean;
  __escapedText: string;
}

export class ObjectMap {
  [key: string]: Expression | ObjectMap;
}

export function typeTextFromTSType(type: Type): TypeText {
  const isAnyType = checkType(type, isAny);
  if (isAnyType) return 'any';

  const isStr = checkType(type, isString);
  const isNum = checkType(type, isNumber);
  const isBool = checkType(type, isBoolean);

  // if type is more than a primitive type at the same time, we mark it as any.
  if (Number(isStr) + Number(isNum) + Number(isBool) > 1) return 'any';
  // At this point we know the prop's type is NOT the mix of primitive types.
  if (isStr) return 'string';
  if (isNum) return 'number';
  if (isBool) return 'boolean';
  return 'unknown';
}

const checkType = (type: Type, check: (type: Type) => boolean) => {
  if (type.flags & TypeFlags.Union) {
    const union = type as UnionType;
    if (union.types.some(t => checkType(t, check))) {
      return true;
    }
  }

  return check(type);
};

const isBoolean = (t: Type) => {
  if (t) {
    return !!(
      t.flags &
      (TypeFlags.Boolean | TypeFlags.BooleanLike | TypeFlags.BooleanLike)
    );
  }

  return false;
};

const isNumber = (t: Type) => {
  if (t) {
    return !!(
      t.flags &
      (TypeFlags.Number | TypeFlags.NumberLike | TypeFlags.NumberLiteral)
    );
  }

  return false;
};

const isString = (t: Type) => {
  if (t) {
    return !!(
      t.flags &
      (TypeFlags.String | TypeFlags.StringLike | TypeFlags.StringLiteral)
    );
  }

  return false;
};

const isAny = (t: Type) => {
  if (t) {
    return !!(t.flags & TypeFlags.Any);
  }

  return false;
};
