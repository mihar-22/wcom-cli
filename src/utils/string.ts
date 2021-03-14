export const pascalToDashCase = (text: string): string =>
  text.replace(/[A-Z]/g, m => `-${m.toLowerCase()}`);

export const escapeQuotes = (text: string): string =>
  text.replace(/^"+|"+$/g, '').replace(/^'+|'+$/g, '');

export const normalizeLineBreaks = (text: string): string =>
  text.replace(/\\r/g, '\n');

export function splitLineBreaks(text: string): string[] {
  if (typeof text !== 'string') return [];
  return normalizeLineBreaks(text).split('\n');
}

export const camelCaseToDashCase = (text: string): string =>
  text.replace(/[A-Z]/g, s => `-${s.toLowerCase()}`);

export const upperCaseFirstChar = (text: string): string =>
  text.charAt(0).toUpperCase() + text.slice(1);

export const dashToPascalCase = (text: string): string =>
  text
    .split('-')
    .filter(segment => segment !== '-')
    .map(upperCaseFirstChar)
    .join('');
