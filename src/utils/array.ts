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
