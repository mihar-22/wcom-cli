import {
  Identifier,
  MethodDeclaration,
  MethodSignature,
  NodeBuilderFlags,
  SignatureKind,
  SyntaxKind,
  TypeChecker,
  TypeFormatFlags,
} from 'typescript';

import { MethodMeta, MethodTypeInfo } from '../../plugins/ComponentMeta';
import { getDocumentation } from './meta-doc';
import { getDocTags, hasDocTag } from './meta-doc-tag';
import { getTypeReferences, typeToString } from './meta-type';

export function buildMethodMetaFromDeclarationOrSignature(
  checker: TypeChecker,
  declaration: MethodDeclaration | MethodSignature,
): MethodMeta {
  const method: Partial<MethodMeta> = {};
  const identifier = declaration.name as Identifier;
  const symbol = checker.getSymbolAtLocation(identifier);
  const name = symbol!.escapedName as string;
  const signature = checker.getSignatureFromDeclaration(declaration)!;
  const returnType = checker.getReturnTypeOfSignature(signature);
  const returnTypeNode = checker.typeToTypeNode(
    returnType,
    declaration,
    NodeBuilderFlags.NoTruncation | NodeBuilderFlags.NoTypeReduction,
  )!;
  const returnText = typeToString(checker, returnType);
  const signatureText = checker.signatureToString(
    signature,
    declaration,
    TypeFormatFlags.WriteArrowStyleSignature | TypeFormatFlags.NoTruncation,
    SignatureKind.Call,
  );
  const isStatic =
    declaration.modifiers?.some(m => m.kind === SyntaxKind.StaticKeyword) ??
    false;

  const typeInfo: MethodTypeInfo = {
    signatureText,
    returnText,
    references: {
      ...getTypeReferences(declaration),
      ...getTypeReferences(returnTypeNode, declaration.getSourceFile()),
    },
  };

  method.node = declaration;
  method.name = name;
  method.static = isStatic;
  method.typeInfo = typeInfo;
  method.signature = signature;
  method.returnType = returnType;
  method.docTags = getDocTags(declaration);
  method.internal = hasDocTag(method.docTags, 'internal');
  method.deprecated = hasDocTag(method.docTags, 'deprecated');
  method.documentation = getDocumentation(checker, identifier);
  return method as MethodMeta;
}
