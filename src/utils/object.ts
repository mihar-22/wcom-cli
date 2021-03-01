import { isArray, isObject } from './unit';

export type CompositeObject<T, R> = T & R;

export const keysOfObject = <T>(obj: T): (keyof T)[] =>
  Object.keys(obj) as (keyof T)[];

// TODO: Types here are kind of messed up.
export const deepFilterObjectKeys = <
  T extends Record<string, unknown>,
  R extends string
>(
  obj: T,
  omitKeys: Set<R>,
): Omit<T, R> => {
  const filteredObj = {} as Omit<T, R> & Record<string, unknown>;

  if (isObject(obj)) {
    keysOfObject(obj).forEach(key => {
      const value: unknown = obj[key];

      if (!omitKeys.has(key as R)) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (filteredObj as any)[key] = deepFilterObjectKeys(
          value as Record<string, unknown>,
          omitKeys,
        );
      }
    });
  } else if (isArray(obj)) {
    return (obj as (keyof T)[]).map(value =>
      deepFilterObjectKeys(value as never, omitKeys),
    ) as never;
  } else {
    return obj;
  }

  return filteredObj;
};

export const objectHasProperty = <T>(obj: T, prop: keyof T): prop is keyof T =>
  Object.prototype.hasOwnProperty.call(obj, prop);

export const sortObjectsBy = <T>(objects: T[], sortKey: keyof T): T[] =>
  objects.sort((a, b) => {
    if (a[sortKey] === b[sortKey]) return 0;
    return a[sortKey] < b[sortKey] ? -1 : 1;
  });
