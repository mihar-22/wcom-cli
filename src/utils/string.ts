export const pascalToDashCase = (
  input: string,
) => input.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`);

export const escapeQuotes = (input: string) => input
  .replace(/^"+|"+$/g, '')
  .replace(/^'+|'+$/g, '');

export const splitLineBreaks = (sourceText: string) => {
  if (typeof sourceText !== 'string') return [];
  sourceText = sourceText.replace(/\\r/g, '\n');
  return sourceText.split('\n');
};
