import { isNil } from './unit';

export function arrayFlat<T>(items: (T[] | T)[]): T[] {
  if ('flat' in items) {
    return ((items as { flat(): void }).flat() as unknown) as T[];
  }

  const flattenArray: T[] = [];
  for (const item of items as T[][]) {
    flattenArray.push(...item);
  }

  return flattenArray;
}

export function arrayOnlyUnique<T>(
  items: T[],
  key: keyof T,
  onDuplicateFound?: (item: T) => void,
  dontFilterNullOrUndefined = false,
): T[] {
  const seen = new Set();

  return items.filter(item => {
    const isUnique =
      (dontFilterNullOrUndefined && isNil(item[key])) || !seen.has(item[key]);

    if (!isUnique) {
      onDuplicateFound?.(item);
    }

    seen.add(item[key]);

    return isUnique;
  });
}
