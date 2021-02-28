import {
  ClassElement,
  Decorator,
  Expression,
  isCallExpression,
  isObjectLiteralExpression,
  isStringLiteral,
} from 'typescript';
import { objectLiteralToObjectMap } from './transform';

export const getDecoratorName = (decorator: Decorator) =>
  isCallExpression(decorator.expression)
    ? decorator.expression.expression.getText()
    : '';

export const isDecoratorNamed = (propName: string) => (decorator: Decorator) =>
  getDecoratorName(decorator) === propName;

export const isDecoratedClassMember = (member: ClassElement) =>
  Array.isArray(member.decorators) && member.decorators.length > 0;

export const getDeclarationParameters: GetDeclarationParameters = (
  decorator: Decorator,
): any => {
  if (!isCallExpression(decorator.expression)) return [];
  return decorator.expression.arguments.map(getDeclarationParameter);
};

const getDeclarationParameter = (arg: Expression): any => {
  if (isObjectLiteralExpression(arg)) {
    return objectLiteralToObjectMap(arg);
  }
  if (isStringLiteral(arg)) {
    return arg.text;
  }

  throw new Error(`Invalid decorator argument: ${arg.getText()}`);
};

export interface GetDeclarationParameters {
  <T>(decorator: Decorator): [T];
  <T, T1>(decorator: Decorator): [T, T1];
  <T, T1, T2>(decorator: Decorator): [T, T1, T2];
}
