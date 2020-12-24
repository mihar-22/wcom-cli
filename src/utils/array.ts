import { isNullOrUndefined } from './unit';

export function arrayFlat<T>(items: (T[] | T)[]): T[] {
  if ('flat' in (items as any)) {
    return (items as any).flat();
  }

  const flattenArray: T[] = [];
  for (const item of items) {
    flattenArray.push(...(item as any));
  }

  return flattenArray;
}

export const arrayOnlyUnique = <T>(
  items: T[],
  key: keyof T,
  onDuplicateFound?: (item: T) => void,
  dontFilterNullOrUndefined = false,
): T[] => {
  const seen = new Set();

  return items.filter((item) => {
    const isUnique = (dontFilterNullOrUndefined && isNullOrUndefined(item[key]))
      || !seen.has(item[key]);

    if (!isUnique) { onDuplicateFound?.(item); }

    seen.add(item[key]);

    return isUnique;
  });
};
