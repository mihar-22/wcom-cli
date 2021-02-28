import { Constructor } from './types';

export const isNull = (input: unknown): input is null => input === null;

export const isUndefined = (input: unknown): input is undefined =>
  typeof input === 'undefined';

export const isNil = (input: unknown): input is null | undefined =>
  isNull(input) || isUndefined(input);

export const getConstructor = <T = unknown>(value: unknown): T | undefined =>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  !isNil(value) ? (value as any).constructor : undefined;

export const isObject = (value: unknown): boolean =>
  getConstructor(value) === Object;

export const isNumber = (input: unknown): input is number =>
  getConstructor(input) === Number && !Number.isNaN(input);

export const isString = (input: unknown): input is string =>
  getConstructor(input) === String;

export const isBoolean = (input: unknown): input is boolean =>
  getConstructor(input) === Boolean;

// eslint-disable-next-line @typescript-eslint/ban-types
export const isFunction = (input: unknown): input is Function =>
  getConstructor(input) === Function;

export const isArray = (input: unknown): input is unknown[] =>
  Array.isArray(input);

export const isInstanceOf = (
  value: unknown,
  constructor: Constructor<unknown>,
): boolean => Boolean(value && constructor && value instanceof constructor);

export const isPrototypeOf = (
  // eslint-disable-next-line @typescript-eslint/ban-types
  value: Object,
  object: Constructor<unknown>,
): boolean =>
  Boolean(
    value && object && Object.isPrototypeOf.call(object.prototype, value),
  );

// eslint-disable-next-line @typescript-eslint/no-empty-function
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const noop = (..._: unknown[]): void => {
  // ...
};
