import { isArray, isObject } from './unit';

export type StringIndexableObject = {
  [key: string]: any
};

export type CompositeObject<T, R> = T & R;

export const keysOfObject = <T>(obj: T) => Object.keys(obj) as Array<keyof T>;

export const deepFilterObjectKeys = <T extends StringIndexableObject, R extends string>(
  obj: T,
  omitKeys: Set<R>,
): Omit<T, R> => {
  const filteredObj: any = {};

  if (isObject(obj)) {
    keysOfObject(obj).forEach((key) => {
      const value: any = obj[key];
      if (!omitKeys.has(key as any)) {
        filteredObj[key] = deepFilterObjectKeys(value, omitKeys);
      }
    });
  } else if (isArray(obj)) {
    return (obj as any[]).map((val) => deepFilterObjectKeys(val, omitKeys)) as any;
  } else {
    return obj;
  }

  return filteredObj;
};

export const objectHasProperty = <T>(obj: T, prop: keyof T) => Object.prototype
  .hasOwnProperty.call(obj, prop);

export const sortObjectsBy = <T extends StringIndexableObject>(
  objects: T[],
  sortKey: keyof T,
) => objects.sort((a, b) => {
    if (a[sortKey] === b[sortKey]) return 0;
    return (a[sortKey] < b[sortKey]) ? -1 : 1;
  });
