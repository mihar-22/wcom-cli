import { bold } from 'kleur';
import normalizePath from 'normalize-path';
import { basename, parse } from 'path';
import {
  forEachChild, Program, SourceFile, TypeChecker, ClassDeclaration, isClassDeclaration,
} from 'typescript';
import {
  log, LogLevel, logStackTrace, logWithTime,
} from '../core/log';
import { sortObjectsBy } from '../utils/object';
import { isUndefined } from '../utils/unit';
import { ComponentMeta } from './ComponentMeta';
import { Discoverer, DiscovererId } from './Discoverer';
import { LitDiscoverer } from './lit-element/LitDiscoverer';
import { getDocumentation } from './utils/transform';
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
      log(() => `Found component at: ${bold(meta.source.filePath)}`, LogLevel.Verbose);
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
  log(`Starting ${bold(discovererId)} discovery`, LogLevel.Verbose);

  const startTime = process.hrtime();
  const components: ComponentMeta[] = [];
  const checker = program.getTypeChecker();
  const discoverer = discoveryMap[discovererId];

  for (const sourceFile of sourceFiles) {
    try {
      const component = discoverComponent(checker, sourceFile, discovererId);
      if (!isUndefined(component)) components.push(component);
    } catch (e) {
      logStackTrace(e.message, e.stack);
    }
  }

  const sortedComponents = sortObjectsBy(components, 'tagName');
  validateUniqueTagNames(sortedComponents);
  discoverer.buildDependencyMap(sortedComponents);

  logWithTime(`Finished ${bold(discovererId)} discovery`, startTime, LogLevel.Verbose);
  return sortedComponents;
}

function buildMeta(discoverer: Discoverer, checker: TypeChecker, cls: ClassDeclaration) {
  const meta: Partial<ComponentMeta> = {};
  const sourceFile = cls.getSourceFile();
  const sourceFilePath = normalizePath(sourceFile.fileName);
  const sourceFileInfo = parse(sourceFilePath);
  meta.source = {
    file: sourceFile,
    fileBase: sourceFileInfo.base,
    fileName: sourceFileInfo.name,
    filePath: sourceFilePath,
    fileExt: sourceFileInfo.ext,
    dirName: basename(sourceFileInfo.dir),
    dirPath: sourceFileInfo.dir,
  };
  meta.declaration = cls;
  meta.symbol = checker.getSymbolAtLocation(cls.name!);
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
  meta.dependents = [];
  return meta as ComponentMeta;
}
