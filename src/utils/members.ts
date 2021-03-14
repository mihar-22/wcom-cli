import {
  ClassElement,
  Identifier,
  MethodSignature,
  PropertySignature,
  SyntaxKind,
  TypeChecker,
} from 'typescript';

export function getMemberName(
  checker: TypeChecker,
  node: ClassElement,
): string | undefined {
  const identifier = node.name as Identifier;
  const symbol = checker.getSymbolAtLocation(identifier);
  return symbol?.escapedName as string | undefined;
}

export const isMemberPrivate = (
  member: ClassElement | PropertySignature | MethodSignature,
): boolean =>
  !!member.modifiers &&
  member.modifiers.some(
    m =>
      m.kind === SyntaxKind.PrivateKeyword ||
      m.kind === SyntaxKind.ProtectedKeyword,
  );
