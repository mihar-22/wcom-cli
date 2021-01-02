export const pascalToDashCase = (
  text: string,
) => text.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`);

export const escapeQuotes = (text: string) => text
  .replace(/^"+|"+$/g, '')
  .replace(/^'+|'+$/g, '');

export const normalizeLineBreaks = (text: string) => text.replace(/\\r/g, '\n');

export const splitLineBreaks = (text: string) => {
  if (typeof text !== 'string') return [];
  return normalizeLineBreaks(text).split('\n');
};
