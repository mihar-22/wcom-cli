import {
  CallExpression,
  ClassDeclaration,
  forEachChild,
  GetAccessorDeclaration,
  Identifier,
  isClassDeclaration,
  isGetAccessor,
  isMethodDeclaration,
  isPropertyDeclaration,
  Node,
  PropertyDeclaration,
  TypeChecker,
} from 'typescript';

import {
  isDecoratedClassMember,
  isDecoratorNamed,
} from '../../utils/decorators';
import { getMemberName, isMemberPrivate } from '../../utils/members';
import {
  buildAnyMetaFromDocTags,
  buildMethodMetaFromDeclarationOrSignature,
  buildPropMetaFromDeclarationOrSignature,
  buildSlotMetaFromDocTags,
  buildSourceMetaFromNode,
  findDocTag,
  getDocTags,
  getDocumentation,
  RESERVED_PUBLIC_MEMBERS,
} from '../../utils/meta';
import { escapeQuotes } from '../../utils/string';
import {
  CssPartMeta,
  CssPropMeta,
  DocTagMeta,
  MethodMeta,
  PropMeta,
  SlotMeta,
} from '../ComponentMeta';
import { PluginBuilder } from '../Plugin';

export interface LitElementPropOptions {
  attribute?: string;
  reflect?: boolean;
}

export interface LitElementEventOptions {
  name?: string;
  bubbles?: boolean;
  composed?: boolean;
}

export const LIT_ELEMENT_LIFECYCLE_METHODS = new Set([
  'createRenderRoot',
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

export type LitElementPluginConfig = Record<string, unknown>;

export const LIT_ELEMENT_PLUGIN_DEFAULT_CONFIG: LitElementPluginConfig = {};

export async function normalizeLitElementPluginConfig(
  config: Partial<LitElementPluginConfig>,
): Promise<LitElementPluginConfig> {
  return {
    ...LIT_ELEMENT_PLUGIN_DEFAULT_CONFIG,
    ...config,
  };
}

/**
 * Discovers components that are built with `LitElement` and builds their respective `ComponentMeta`.
 * This plugin will follow the complete heritage tree including mixins, subclasses and interfaces
 * and merge them together. This will run in the `discover` and `build` plugin lifecycle
 * steps. For more information on how to document your components see the project
 * [README.md](https://github.com/mihar-22/wcom-cli#documenting-components).
 *
 * **IMPORTANT:** This plugin currently only supports TypeScript, so your web components
 * must be declared inside `.ts` files.
 *
 * @example
 * ```ts
 * // wcom.config.ts
 *
 * import { litElementPlugin } from '@wcom/cli';
 *
 * export default [
 *   litElementPlugin({
 *     // Configuration options here.
 *   }),
 * ];
 * ```
 */
export const litElementPlugin: PluginBuilder<
  Partial<LitElementPluginConfig>,
  ClassDeclaration
> = () => {
  let checker: TypeChecker;

  return {
    name: 'wcom-lit-element',

    async init(program) {
      checker = program.getTypeChecker();
    },

    async discover(sourceFile) {
      const discovered: ClassDeclaration[] = [];

      function visit(node: Node) {
        if (isClassDeclaration(node) && findTagName(node).length > 0) {
          discovered.push(node);
        }
      }

      forEachChild(sourceFile, visit);
      return discovered;
    },

    async build(declaration) {
      const identifier = declaration.name as Identifier;
      const docTags = getDocTags(declaration);
      return {
        node: declaration,
        source: buildSourceMetaFromNode(declaration),
        documentation: getDocumentation(checker, identifier),
        className: identifier.escapedText as string,
        props: findProps(checker, declaration),
        methods: findMethods(checker, declaration),
        events: [],
        tagName: findTagName(declaration),
        docTags,
        cssProps: findCssProps(docTags),
        cssParts: findCssParts(docTags),
        slots: findSlots(docTags),
        heritage: [],
        dependencies: [],
        dependents: [],
      };
    },
  };
};

function findTagName(declaration: ClassDeclaration): string {
  const customElDecorator = (declaration.decorators ?? []).find(
    isDecoratorNamed('customElement'),
  );

  const tagName =
    (customElDecorator?.expression as CallExpression).arguments[0].getText() ??
    findDocTag(getDocTags(declaration), 'tagname')?.text;

  return escapeQuotes(tagName ?? '');
}

function findProps(
  checker: TypeChecker,
  declaration: ClassDeclaration,
): PropMeta[] {
  return declaration.members
    .filter(
      node =>
        (isPropertyDeclaration(node) &&
          isDecoratedClassMember(node) &&
          node.decorators!.find(isDecoratorNamed('property'))) ||
        (isGetAccessor(node) && !isMemberPrivate(node)),
    )
    .map(node =>
      buildPropMetaFromDeclarationOrSignature<LitElementPropOptions>(
        checker,
        node as PropertyDeclaration | GetAccessorDeclaration,
        'property',
        'internalProperty',
        opts => opts ?? {},
      ),
    );
}

function findMethods(
  checker: TypeChecker,
  declaration: ClassDeclaration,
): MethodMeta[] {
  return declaration.members
    .filter(isMethodDeclaration)
    .filter(node => !isMemberPrivate(node))
    .filter(
      node =>
        !RESERVED_PUBLIC_MEMBERS.has(getMemberName(checker, node) ?? '') &&
        !LIT_ELEMENT_LIFECYCLE_METHODS.has(getMemberName(checker, node)!),
    )
    .map(node => buildMethodMetaFromDeclarationOrSignature(checker, node));
}

function findCssProps(tags: DocTagMeta[]): CssPropMeta[] {
  return buildAnyMetaFromDocTags(
    tags,
    'cssprop',
    '@cssprop --bg-color - The background color of this component.',
  );
}

function findCssParts(tags: DocTagMeta[]): CssPartMeta[] {
  return buildAnyMetaFromDocTags(
    tags,
    'csspart',
    '@csspart container - The root container of this component.',
  );
}

function findSlots(tags: DocTagMeta[]): SlotMeta[] {
  return buildSlotMetaFromDocTags(tags);
}
