import {
  ClassElement,
  Decorator,
  Expression,
  isCallExpression,
  isObjectLiteralExpression,
  isStringLiteral,
} from 'typescript';

import { ObjectMap } from './meta';
import { objectLiteralToObjectMap } from './meta/meta-type';

export const getDecoratorName = (decorator: Decorator): string =>
  isCallExpression(decorator.expression)
    ? decorator.expression.expression.getText()
    : '';

export const isDecoratorNamed = (propName: string) => (
  decorator: Decorator,
): boolean => getDecoratorName(decorator) === propName;

export const isDecoratedClassMember = (member: ClassElement): boolean =>
  Array.isArray(member.decorators) && member.decorators.length > 0;

export const getDeclarationParameters: GetDeclarationParameters = (
  decorator: Decorator,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): any => {
  if (!isCallExpression(decorator.expression)) return [];
  return decorator.expression.arguments.map(getDeclarationParameter);
};

function getDeclarationParameter(arg: Expression): string | ObjectMap {
  if (isObjectLiteralExpression(arg)) {
    return objectLiteralToObjectMap(arg);
  }

  if (isStringLiteral(arg)) {
    return arg.text;
  }

  throw new Error(`Invalid decorator argument: ${arg.getText()}`);
}

export interface GetDeclarationParameters {
  <T>(decorator: Decorator): [T];
  <T, T1>(decorator: Decorator): [T, T1];
  <T, T1, T2>(decorator: Decorator): [T, T1, T2];
}
