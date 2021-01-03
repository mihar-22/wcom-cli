/* eslint-disable no-bitwise */
import { dim } from 'kleur';
import { SymbolFlags, TypeChecker } from 'typescript';
import { log, LogLevel, reportDiagnosticByNode } from '../core/log';
import { arrayOnlyUnique } from '../utils/array';
import { isUndefined } from '../utils/unit';
import { ComponentMeta } from './ComponentMeta';
import { isDecoratorNamed } from './utils/decorators';

export function validateComponent(
  checker: TypeChecker,
  component: ComponentMeta,
  customElementDecoratorName: string,
) {
  const tagError = validateComponentTag(component.tagName);
  if (!isUndefined(tagError)) {
    reportDiagnosticByNode(
      tagError,
      component.declaration.decorators!.find(isDecoratorNamed(customElementDecoratorName))!,
      LogLevel.Error,
    );
  }

  const nonTypeExports = checker
    .getExportsOfModule(checker.getSymbolAtLocation(component.source.file)!)
    .filter((symb) => (symb.flags & (SymbolFlags.Interface | SymbolFlags.TypeAlias)) === 0)
    .filter((symb) => symb.name !== component.className);

  nonTypeExports.forEach((symb) => {
    const errorNode = symb.valueDeclaration ? symb.valueDeclaration : symb.declarations[0];
    reportDiagnosticByNode([
      `To allow efficient bundling, modules using \`@${customElementDecoratorName}()\` can only`,
      'have a single export which is the component class itself.',
    ].join('\n'), errorNode, LogLevel.Error);
  });
}

export function validateUniqueTagNames(components: ComponentMeta[]) {
  arrayOnlyUnique(components, 'tagName').forEach((component) => {
    const { tagName } = component;
    const usedBy = components.filter((c) => c.tagName === tagName);
    if (usedBy.length > 1) {
      log(() => [
        `Found the component tag name \`${tagName}\` more than once. Tag names must be unique.\n`,
        usedBy.map((c, i) => dim(`\t${i + 1}. ${c.source.filePath}`)).join('\n'),
      ].join('\n'), LogLevel.Warn);
    }
  });
}

export const validateComponentTag = (tag: string) => {
  if (tag !== tag.trim()) {
    return 'Tag can not contain white spaces.';
  }

  if (tag !== tag.toLowerCase()) {
    return 'Tag can not contain upper case characters.';
  }

  if (typeof tag !== 'string') {
    return `Tag \`${tag}\` must be a string type.`;
  }

  if (tag.length === 0) {
    return 'Received empty tag value.';
  }

  if (tag.indexOf(' ') > -1) {
    return `\`${tag}\` tag cannot contain a space.`;
  }

  if (tag.indexOf(',') > -1) {
    return `\`${tag}\` tag cannot be used for multiple tags.`;
  }

  const invalidChars = tag.replace(/\w|-/g, '');
  if (invalidChars !== '') {
    return `\`${tag}\` tag contains invalid characters: ${invalidChars}.`;
  }

  if (tag.indexOf('-') === -1) {
    return `\`${tag}\` tag must contain a dash (-) to work as a valid web component.`;
  }

  if (tag.indexOf('--') > -1) {
    return `\`${tag}\` tag cannot contain multiple dashes (--) next to each other.`;
  }

  if (tag.indexOf('-') === 0) {
    return `\`${tag}\` tag cannot start with a dash (-).`;
  }

  if (tag.lastIndexOf('-') === tag.length - 1) {
    return `\`${tag}\` tag cannot end with a dash (-).`;
  }

  return undefined;
};
