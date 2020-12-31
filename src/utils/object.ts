export type StringIndexableObject = {
  [key: string]: any
};

export type CompositeObject<T, R> = T & R;

export const keysOfObject = <T>(obj: T) => Object.keys(obj) as Array<keyof T>;
