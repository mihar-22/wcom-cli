/* eslint-disable no-bitwise */
import {
  Identifier, MethodDeclaration, NodeBuilderFlags, PropertyDeclaration, SignatureKind, Type,
  TypeChecker, TypeFlags, TypeFormatFlags, UnionType, ClassElement, TypeNode, isTypeReferenceNode,
  isIdentifier, GetAccessorDeclaration, isPropertyDeclaration,
} from 'typescript';
import { bold } from 'kleur';
import { LogLevel, reportDiagnosticByNode } from '../../core/log';
import { isUndefined } from '../../utils/unit';
import {
  DocTag, EventMeta, MethodMeta, MethodTypeInfo, PropMeta, PropTypeInfo, TypeText,
} from '../ComponentMeta';
import { getDeclarationParameters, isDecoratorNamed } from './decorators';
import {
  getDocTags, getDocumentation, getTypeReferences, hasDocTag, isMemberPrivate, resolveType,
  splitJsDocTagText, typeToString,
} from './transform';
import { validatePublicName } from '../validatePublicName';
import { arrayOnlyUnique } from '../../utils/array';

export interface DefaultPropOptions {
  attribute?: string;
  reflect?: boolean;
}

export const getMemberName = (checker: TypeChecker, node: ClassElement) => {
  const identifier = node.name as Identifier;
  const symbol = checker.getSymbolAtLocation(identifier);
  return symbol?.escapedName as string | undefined;
};

export function buildPropMeta<T>(
  checker: TypeChecker,
  node: PropertyDeclaration | GetAccessorDeclaration,
  propDecoratorName: string,
  internalPropDecoratorName: string,
  transformPropOptions: (propOptions: T) => DefaultPropOptions,
): PropMeta {
  const meta: Partial<PropMeta> = {};
  const identifier = node.name as Identifier;
  const symbol = checker.getSymbolAtLocation(identifier)!;
  const type = checker.getTypeAtLocation(node);
  const name = symbol.escapedName as string;
  const isProperty = isPropertyDeclaration(node);
  const decorator = node.decorators?.find(isDecoratorNamed(propDecoratorName));
  const decoratorParams = decorator ? getDeclarationParameters<T>(decorator) : undefined;
  const propOptions = (decoratorParams?.[0] ?? {}) as T;
  const hasSetter = !isProperty ? (symbol.declarations.length > 1) : undefined;

  if (isProperty && isMemberPrivate(node)) {
    reportDiagnosticByNode([
      `Property \`${name}\` cannot be \`private\` or \`protected\`. Use the`,
      `\`@${internalPropDecoratorName}()\` decorator instead.`,
    ].join('\n'), node, LogLevel.Warn);
  }

  validatePublicName(name, 'property', node);

  const typeText = typeTextFromTSType(type);

  // Prop can have an attribute if type is NOT "unknown".
  if ((typeText !== 'unknown') || (!isProperty && hasSetter)) {
    const { attribute, reflect } = transformPropOptions(propOptions);
    meta.attribute = attribute?.trim().toLowerCase();
    meta.reflect = reflect ?? false;
  }

  meta.name = name;
  meta.declaration = node;
  meta.symbol = symbol;
  meta.decorator = decorator;
  meta.type = type;
  meta.typeText = typeText;
  meta.isAccessor = !isProperty;
  meta.hasSetter = hasSetter;
  meta.typeInfo = getPropTypeInfo(checker, node, type);
  meta.documentation = getDocumentation(checker, identifier);
  meta.defaultValue = isPropertyDeclaration(node) ? node.initializer?.getText() : undefined;
  meta.docTags = getDocTags(node);
  meta.readonly = (!isProperty && !hasSetter) && hasDocTag(meta.docTags, 'readonly');
  meta.internal = hasDocTag(meta.docTags, 'internal');
  meta.deprecated = hasDocTag(meta.docTags, 'deprecated');
  meta.required = !isUndefined(node.exclamationToken) || hasDocTag(meta.docTags, 'required');
  meta.optional = !isUndefined(node.questionToken);
  return meta as PropMeta;
}

export function buildMethodMeta(checker: TypeChecker, node: MethodDeclaration): MethodMeta {
  const meta: Partial<MethodMeta> = {};
  const identifier = node.name as Identifier;
  const symbol = checker.getSymbolAtLocation(identifier);
  const name = symbol!.escapedName as string;
  const signature = checker.getSignatureFromDeclaration(node)!;
  const returnType = checker.getReturnTypeOfSignature(signature);
  const returnTypeNode = checker.typeToTypeNode(
    returnType,
    node,
    NodeBuilderFlags.NoTruncation | NodeBuilderFlags.NoTypeReduction,
  )!;
  const returnText = typeToString(checker, returnType);
  const signatureText = checker.signatureToString(
    signature,
    node,
    TypeFormatFlags.WriteArrowStyleSignature | TypeFormatFlags.NoTruncation,
    SignatureKind.Call,
  );

  const typeInfo: MethodTypeInfo = {
    signature: signatureText,
    return: returnText,
    references: {
      ...getTypeReferences(node),
      ...getTypeReferences(returnTypeNode, node.getSourceFile()),
    },
  };

  validatePublicName(name, 'method', node);

  meta.name = name;
  meta.symbol = symbol;
  meta.typeInfo = typeInfo;
  meta.declaration = node;
  meta.signature = signature;
  meta.returnType = returnType;
  meta.docTags = getDocTags(node);
  meta.internal = hasDocTag(meta.docTags, 'internal');
  meta.deprecated = hasDocTag(meta.docTags, 'deprecated');
  meta.documentation = getDocumentation(checker, identifier);
  return meta as MethodMeta;
}

export interface DefaultEventOptions {
  name?: string
  bubbles?: boolean;
  composed?: boolean;
}

export function buildEventMeta<T>(
  checker: TypeChecker,
  node: PropertyDeclaration,
  eventDecoratorName: string,
  transformEventOptions: (propOptions: T) => DefaultEventOptions,
): EventMeta {
  const meta: Partial<EventMeta> = {};
  const identifier = node.name as Identifier;
  const symbol = checker.getSymbolAtLocation(identifier)!;
  const type = checker.getTypeAtLocation(node);
  const name = symbol.escapedName as string;
  const decorator = node.decorators!.find(isDecoratorNamed(eventDecoratorName))!;
  const decoratorParams = getDeclarationParameters<T>(decorator);
  const eventOptions = (decoratorParams[0] ?? {}) as T;
  const { name: eventName, composed, bubbles } = transformEventOptions(eventOptions);
  meta.name = eventName?.trim() ?? name;
  meta.composed = composed ?? true;
  meta.bubbles = bubbles ?? true;
  meta.symbol = symbol;
  meta.declaration = node;
  meta.decorator = decorator;
  meta.type = type;
  meta.typeInfo = getEventTypeInfo(checker, node);
  meta.docTags = getDocTags(node);
  meta.internal = hasDocTag(meta.docTags, 'internal');
  meta.deprecated = hasDocTag(meta.docTags, 'deprecated');
  meta.documentation = getDocumentation(checker, identifier);
  return meta as EventMeta;
}

export function buildMetaFromTags(
  docTags: DocTag[],
  tagName: string,
  example: string,
) {
  const tags = docTags
    .filter((tag) => tag.name === tagName)
    .map((tag) => splitJsDocTagText(tag));

  return arrayOnlyUnique(
    tags,
    'title',
    (tag) => {
      reportDiagnosticByNode(
        `Found duplicate \`@${tagName}\` tags with the name \`${tag.title}\`.`,
        tag.node,
        LogLevel.Warn,
      );
    },
    true,
  ).map((tag) => {
    if (!tag.description) {
      reportDiagnosticByNode([
        `Tag \`@${tagName}\` is missing a description.`,
        `\n${bold('EXAMPLE')}\n\n${example}`,
      ].join('\n'), tag.node, LogLevel.Warn);
    }

    return {
      name: tag.title ?? '',
      description: tag.description ?? '',
      node: tag.node,
    };
  });
}

export function buildSlotMeta(tags: DocTag[]) {
  let defaultSlots = 0;
  let hasSeenDefaultSlot = false;

  const slots = tags
    .filter((tag) => tag.name === 'slot')
    .map((tag) => splitJsDocTagText(tag));

  return arrayOnlyUnique(
    slots,
    'title',
    (slot) => {
      reportDiagnosticByNode(
        `Found duplicate \`@slot\` tags with the name \`${slot.title}\`.`,
        slot.node,
        LogLevel.Warn,
      );
    },
    true,
  ).map((slot) => {
    const isDefault = !slot.description;

    if (isDefault && hasSeenDefaultSlot) {
      reportDiagnosticByNode([
        'Non default `@slot` tag is missing a description.',
        `\n${bold('EXAMPLE')}\n\n@slot body: Used to pass in the body of this component.`,
      ].join('\n'), slot.node, LogLevel.Warn);
    }

    if (isDefault) {
      defaultSlots += 1;
      hasSeenDefaultSlot = true;
    }

    return {
      name: isDefault ? '' : slot.title,
      default: isDefault && (defaultSlots === 1),
      description: isDefault ? slot.title : (slot.description ?? ''),
      node: slot.node,
    };
  });
}

export const getPropTypeInfo = (
  typeChecker: TypeChecker,
  node: PropertyDeclaration | GetAccessorDeclaration,
  type: Type,
): PropTypeInfo => {
  const nodeType = node.type;

  return {
    original: nodeType ? nodeType.getText() : typeToString(typeChecker, type),
    resolved: resolveType(typeChecker, type),
    references: getTypeReferences(node),
  };
};

export const getEventTypeInfo = (typeChecker: TypeChecker, node: PropertyDeclaration) => {
  const sourceFile = node.getSourceFile();
  const eventType = node.type ? getEventType(node.type) : undefined;
  return {
    original: eventType ? eventType.getText() : 'any',
    resolved: eventType ? resolveType(typeChecker, typeChecker.getTypeFromTypeNode(eventType)) : 'any',
    references: eventType ? getTypeReferences(eventType, sourceFile) : {},
  };
};

export const getEventType = (type: TypeNode): TypeNode | undefined => {
  if (isTypeReferenceNode(type)
    && isIdentifier(type.typeName)
    && type.typeName.text === 'EventEmitter'
    && type.typeArguments
    && (type.typeArguments.length > 0)
  ) {
    return type.typeArguments[0];
  }

  return undefined;
};

export const typeTextFromTSType = (type: Type): TypeText => {
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
};

const checkType = (type: Type, check: (type: Type) => boolean) => {
  if (type.flags & TypeFlags.Union) {
    const union = type as UnionType;
    if (union.types.some((t) => checkType(t, check))) {
      return true;
    }
  }

  return check(type);
};

const isBoolean = (t: Type) => {
  if (t) {
    return !!(t.flags & (TypeFlags.Boolean | TypeFlags.BooleanLike | TypeFlags.BooleanLike));
  }

  return false;
};

const isNumber = (t: Type) => {
  if (t) {
    return !!(t.flags & (TypeFlags.Number | TypeFlags.NumberLike | TypeFlags.NumberLiteral));
  }

  return false;
};

const isString = (t: Type) => {
  if (t) {
    return !!(t.flags & (TypeFlags.String | TypeFlags.StringLike | TypeFlags.StringLiteral));
  }

  return false;
};

const isAny = (t: Type) => {
  if (t) {
    return !!(t.flags & TypeFlags.Any);
  }

  return false;
};
