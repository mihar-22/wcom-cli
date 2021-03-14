import { displayPartsToString, Identifier, TypeChecker } from 'typescript';

import { normalizeLineBreaks } from '../../utils/string';

export function getDocumentation(checker: TypeChecker, id: Identifier): string {
  const comment = checker
    .getSymbolAtLocation(id)
    ?.getDocumentationComment(checker);
  return normalizeLineBreaks(displayPartsToString(comment) ?? '');
}
