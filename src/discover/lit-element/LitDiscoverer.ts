import {
  CallExpression, ClassDeclaration, GetAccessorDeclaration, isGetAccessor,
  isImportDeclaration, isMethodDeclaration, isPropertyDeclaration, PropertyDeclaration, TypeChecker,
} from 'typescript';
import { resolve, dirname } from 'path';
import { log, LogLevel } from '../../core/log';
import { escapeQuotes } from '../../utils/string';
import { ComponentMeta, DocTag } from '../ComponentMeta';
import { Discoverer } from '../Discoverer';
import { isDecoratedClassMember, isDecoratorNamed } from '../utils/decorators';
import { getDocTags, isMemberPrivate } from '../utils/transform';
import {
  buildEventMeta, buildMetaFromTags, buildMethodMeta, buildPropMeta, buildSlotMeta, getMemberName,
} from '../utils/meta';

export interface LitPropOptions {
  attribute?: string;
  reflect?: boolean;
}

export interface LitEventOptions {
  name?: string
  bubbles?: boolean;
  composed?: boolean;
}

export const LIT_LIFECYCLE_METHODS = new Set([
  'connectedCallback',
  'disconnectedCallback',
  'performUpdate',
  'shouldUpdate',
  'update',
  'render',
  'firstUpdated',
  'updated',
  'updateComplete',
]);

export const LitDiscoverer: Discoverer = {
  CUSTOM_ELEMENT_DECORATOR_NAME: 'customElement',

  isComponent(cls: ClassDeclaration) {
    if (!cls.decorators) return false;
    const customElDecorator = cls.decorators.find(isDecoratorNamed('customElement'));
    if (!customElDecorator) return false;
    log(() => `Found component at ${cls.getSourceFile().fileName}`, LogLevel.Verbose);
    return true;
  },

  findTagName(cls: ClassDeclaration) {
    const customElDecorator = cls.decorators!.find(isDecoratorNamed('customElement'))!;
    const tagName = (customElDecorator.expression as CallExpression).arguments[0].getText();
    return escapeQuotes(tagName);
  },

  findProps(checker: TypeChecker, cls: ClassDeclaration) {
    return cls.members
      .filter((node) => (
        isPropertyDeclaration(node)
        && isDecoratedClassMember(node)
        && node.decorators!.find(isDecoratorNamed('property')))
        || (isGetAccessor(node) && !isMemberPrivate(node)))
      .map((node) => buildPropMeta<LitPropOptions>(
        checker,
        (node as PropertyDeclaration | GetAccessorDeclaration),
        'property',
        'internalProperty',
        (opts) => (opts ?? {}),
      ));
  },

  findMethods(checker: TypeChecker, cls: ClassDeclaration) {
    return cls.members
      .filter(isMethodDeclaration)
      .filter((node) => !isMemberPrivate(node))
      .filter((node) => !LIT_LIFECYCLE_METHODS.has(getMemberName(checker, node)!))
      .map((node) => buildMethodMeta(checker, node));
  },

  findEvents(checker: TypeChecker, cls: ClassDeclaration) {
    return cls.members
      .filter(isPropertyDeclaration)
      .filter(isDecoratedClassMember)
      .filter((node) => node.decorators!.find(isDecoratorNamed('event')))
      .map((node) => buildEventMeta<LitEventOptions>(
        checker,
        node,
        'event',
        (opts) => (opts ?? {}),
      ));
  },

  findDocTags(cls: ClassDeclaration) {
    return getDocTags(cls);
  },

  findCssProps(tags: DocTag[]) {
    return buildMetaFromTags(
      tags,
      'cssprop',
      '@cssprop --bg-color: The background color of this component.',
    );
  },

  findCssParts(tags: DocTag[]) {
    return buildMetaFromTags(
      tags,
      'csspart',
      '@csspart container: The root container of this component.',
    );
  },

  findSlots(tags: DocTag[]) {
    return buildSlotMeta(tags);
  },

  buildDependencyMap(components: ComponentMeta[]) {
    const map = new Map<string, ComponentMeta>();
    const paths = new Set<string>();

    const trimFileExt = (input: string) => input.replace(/\.[^/.]+$/, '');

    components.forEach((component) => {
      const path = trimFileExt(component.sourceFile.fileName);
      map.set(path, component);
      paths.add(path);
    });

    components.forEach((component) => {
      const { sourceFile } = component;
      const sourceDir = dirname(sourceFile.fileName);
      sourceFile.statements
        .filter(isImportDeclaration)
        .forEach((importStmt) => {
          const relativeImportPath = escapeQuotes(importStmt.moduleSpecifier.getText());
          let absolutePathToImport = resolve(sourceDir, relativeImportPath);

          if (absolutePathToImport.endsWith('ts')) {
            absolutePathToImport = trimFileExt(absolutePathToImport);
          }

          if (paths.has(absolutePathToImport)) {
            const dependency = map.get(absolutePathToImport)!;
            if (!component.dependencies.includes(dependency)) {
              component.dependencies.push(dependency);
            }
          }
        });
    });
  },
};
