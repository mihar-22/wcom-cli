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

  keysOfObject(obj).forEach((key) => {
    const value: any = obj[key];
    if (isObject(value)) {
      filteredObj[key] = deepFilterObjectKeys(value, omitKeys);
    } else if (isArray(value)) {
      filteredObj[key] = value.map((val) => deepFilterObjectKeys(val, omitKeys));
    } else if (!omitKeys.has(key as any)) {
      filteredObj[key] = value;
    }
  });

  return filteredObj;
};
