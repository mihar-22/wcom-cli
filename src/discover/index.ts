import normalizePath from 'normalize-path';
import {
  forEachChild, Program, SourceFile, TypeChecker, ClassDeclaration, isClassDeclaration,
} from 'typescript';
import { log, LogLevel } from '../core/log';
import { isUndefined } from '../utils/unit';
import { ComponentMeta } from './ComponentMeta';
import { Discoverer, DiscovererId } from './Discoverer';
import { LitDiscoverer } from './lit-element/LitDiscoverer';
import { getDocumentation, getTypeReferences } from './utils/transform';
import { validateComponent, validateUniqueTagNames } from './validation';

const discoveryMap: Record<DiscovererId, Discoverer> = Object.freeze({
  [DiscovererId.Lit]: LitDiscoverer,
});

export function discoverComponent(
  checker: TypeChecker,
  sourceFile: SourceFile,
  discovererId: DiscovererId,
) {
  const discoverer = discoveryMap[discovererId];

  return forEachChild(sourceFile, (node) => {
    if (isClassDeclaration(node) && discoverer.isComponent(node)) {
      const meta = buildMeta(discoverer, checker, node);
      validateComponent(checker, meta, discoverer.CUSTOM_ELEMENT_DECORATOR_NAME);
      log(meta, LogLevel.Verbose);
      return meta;
    }

    return undefined;
  });
}

export function discover(
  program: Program,
  sourceFiles: SourceFile[],
  discovererId: DiscovererId,
): ComponentMeta[] {
  log(() => `Starting ${discovererId} discovery`, LogLevel.Verbose);

  const components: ComponentMeta[] = [];
  const checker = program.getTypeChecker();
  const discoverer = discoveryMap[discovererId];

  for (const sourceFile of sourceFiles) {
    const component = discoverComponent(checker, sourceFile, discovererId);
    if (!isUndefined(component)) components.push(component);
  }

  validateUniqueTagNames(components);
  discoverer.buildDependencyMap(components);

  log(() => `Finished ${discovererId} discovery`, LogLevel.Verbose);
  return components;
}

function buildMeta(discoverer: Discoverer, checker: TypeChecker, cls: ClassDeclaration) {
  const meta: Partial<ComponentMeta> = {};
  const sourceFile = cls.getSourceFile();
  meta.sourceFile = sourceFile;
  meta.sourceFilePath = normalizePath(sourceFile.fileName);
  meta.declaration = cls;
  meta.symbol = checker.getSymbolAtLocation(cls.name!);
  meta.references = getTypeReferences(cls);
  meta.documentation = getDocumentation(checker, cls.name!);
  meta.className = cls.name!.escapedText as string;
  meta.props = discoverer.findProps(checker, cls);
  meta.methods = discoverer.findMethods(checker, cls);
  meta.events = discoverer.findEvents(checker, cls);
  meta.tagName = discoverer.findTagName(cls);
  meta.docTags = discoverer.findDocTags(cls);
  meta.cssProps = discoverer.findCssProps(meta.docTags);
  meta.cssParts = discoverer.findCssParts(meta.docTags);
  meta.slots = discoverer.findSlots(meta.docTags);
  meta.dependencies = [];
  return meta as ComponentMeta;
}
