import {
  __String,
  ArrowFunction,
  CallExpression,
  ClassDeclaration,
  ClassExpression,
  Declaration,
  ExpressionWithTypeArguments,
  factory,
  forEachChild,
  FunctionDeclaration,
  HeritageClause,
  Identifier,
  InterfaceDeclaration,
  isCallExpression,
  isClassDeclaration,
  isClassExpression,
  isExpressionWithTypeArguments,
  isFunctionDeclaration,
  isHeritageClause,
  isIdentifier,
  isInterfaceDeclaration,
  isMethodSignature,
  isParameter,
  isPropertySignature,
  isReturnStatement,
  isTypeAliasDeclaration,
  isVariableDeclaration,
  Node,
  SyntaxKind,
  TypeAliasDeclaration,
  TypeChecker,
  VariableDeclaration,
} from 'typescript';

import { buildComponentMetaWithHeritage } from '../../cli/commands/transform/discover';
import {
  HeritageKind,
  HeritageMeta,
  MethodMeta,
  PropMeta,
} from '../../plugins/ComponentMeta';
import { Plugin } from '../../plugins/Plugin';
import { isUndefined } from '../../utils/unit';
import { getDocumentation } from './meta-doc';
import { getDocTags } from './meta-doc-tag';
import { buildMethodMetaFromDeclarationOrSignature } from './meta-method';
import {
  buildPropMetaFromDeclarationOrSignature,
  getPropTypeInfo,
} from './meta-prop';
import { buildSourceMetaFromNode } from './meta-source';
import { getTypeSourceFile } from './meta-type';

export const IGNORE_HERITAGE = new Set(['LitElement']);

export async function buildHeritageMetaTree(
  checker: TypeChecker,
  plugin: Plugin,
  heritages: HeritageMeta[],
  parent?: HeritageMeta,
): Promise<HeritageMeta[]> {
  if (isUndefined(plugin.build)) return [];

  const chain: HeritageMeta[] = [];

  await Promise.all(
    heritages
      .filter(heritage => !IGNORE_HERITAGE.has(heritage.name))
      .map(async heritage => {
        const declaration = getHeritageDeclaration(heritage, checker);
        if (isUndefined(declaration)) return;

        // Class.
        if (isClassDeclaration(declaration)) {
          chain.push(
            await buildClassHeritageMeta(
              checker,
              plugin,
              heritage,
              declaration,
            ),
          );
        }
        // Interface.
        else if (
          isTypeAliasDeclaration(declaration) ||
          isInterfaceDeclaration(declaration)
        ) {
          chain.push(
            await buildInterfaceHeritageMeta(
              checker,
              plugin,
              heritage,
              declaration,
              parent,
            ),
          );
        }
        // Mixin.
        else if (
          isVariableDeclaration(declaration) ||
          isFunctionDeclaration(declaration)
        ) {
          chain.push(
            await buildMixinHeritageMeta(
              checker,
              plugin,
              heritage,
              declaration,
            ),
          );
        }
      }),
  );

  return chain;
}

export async function buildClassHeritageMeta(
  checker: TypeChecker,
  plugin: Plugin,
  heritage: HeritageMeta,
  declaration: ClassDeclaration | ClassExpression,
): Promise<HeritageMeta> {
  const component = await buildComponentMetaWithHeritage(
    checker,
    plugin,
    declaration,
    heritage,
  );
  return {
    ...heritage,
    component,
  };
}

export async function buildMixinHeritageMeta(
  checker: TypeChecker,
  plugin: Plugin,
  heritage: HeritageMeta,
  declaration: VariableDeclaration | FunctionDeclaration,
): Promise<HeritageMeta> {
  const body = isVariableDeclaration(declaration)
    ? (declaration.initializer as ArrowFunction).body
    : declaration.body!;

  const mixin = forEachChild(body, node => {
    if (isClassDeclaration(node)) return node;

    if (isReturnStatement(node) && isClassExpression(node.expression!)) {
      return node.expression;
    }

    return undefined;
  });

  const mixinMeta = mixin
    ? await buildComponentMetaWithHeritage(checker, plugin, mixin, heritage)
    : undefined;

  return {
    ...heritage,
    mixin: mixinMeta,
  };
}

export async function buildInterfaceHeritageMeta(
  checker: TypeChecker,
  plugin: Plugin,
  heritage: HeritageMeta,
  declaration: TypeAliasDeclaration | InterfaceDeclaration,
  parent?: HeritageMeta,
): Promise<HeritageMeta> {
  const props: PropMeta[] = [];
  const methods: MethodMeta[] = [];
  const heritages = isInterfaceDeclaration(declaration)
    ? buildHeritageMeta(checker, declaration, parent)
    : [];

  // Follow interface heritages all the way up.
  heritages
    .map(h => getHeritageDeclaration(h, checker))
    .filter(d => !isUndefined(d) && isInterfaceDeclaration(d))
    .map(d =>
      buildHeritageMetaTree(
        checker,
        plugin,
        buildHeritageMeta(checker, d! as InterfaceDeclaration, heritage),
        heritage,
      ),
    );

  // TODO: handle this case by finding and unpacking type references.
  if (isTypeAliasDeclaration(declaration)) {
    // ...
  }

  function findSignatures(node: Node) {
    if (isPropertySignature(node)) {
      props.push(buildPropMetaFromDeclarationOrSignature(checker, node));
      return;
    }

    if (isMethodSignature(node)) {
      methods.push(buildMethodMetaFromDeclarationOrSignature(checker, node));
      return;
    }

    forEachChild(node, findSignatures);
  }

  forEachChild(declaration, findSignatures);

  return {
    ...heritage,
    interface: {
      node: declaration,
      source: buildSourceMetaFromNode(declaration),
      props,
      methods,
      heritage: heritages,
      docTags: getDocTags(declaration),
      documentation: getDocumentation(checker, declaration.name as Identifier),
    },
  };
}

export function getHeritageDeclaration(
  heritage: HeritageMeta,
  checker: TypeChecker,
): Declaration | undefined {
  const type = checker.getTypeAtLocation(heritage.node);
  const sourceFile = getTypeSourceFile(type);
  const fileSymbol = checker.getSymbolAtLocation(sourceFile)!;
  const symbol = fileSymbol?.exports?.get(heritage.name as __String);
  return symbol?.getDeclarations()?.[0];
}

export function buildHeritageMeta<T extends Node>(
  checker: TypeChecker,
  declaration: T,
  parent?: HeritageMeta,
): HeritageMeta[] {
  const heritage: HeritageMeta[] = [];

  const clauseToMeta = (
    node: ExpressionWithTypeArguments | Identifier | CallExpression,
  ) => {
    if (isIdentifier(node)) {
      const isParentHeritageClause = isHeritageClause(node.parent.parent);
      const isParentCallExpression = isCallExpression(node.parent);
      const isBaseMixinClass =
        isParentCallExpression &&
        (node.parent as CallExpression).expression !== node;
      const symbol = checker.getSymbolAtLocation(node)!;
      const clauseDeclaration = symbol.getDeclarations?.()?.[0];

      if (isParameter(clauseDeclaration!)) {
        return;
      }

      const kind = isParentCallExpression
        ? isBaseMixinClass
          ? HeritageKind.Subclass
          : HeritageKind.Mixin
        : isParentHeritageClause &&
          (node.parent.parent as HeritageClause).token ===
            SyntaxKind.ImplementsKeyword
        ? HeritageKind.Interface
        : HeritageKind.Subclass;

      const name = node.escapedText.toString();
      const type = checker.getTypeAtLocation(node);

      heritage.push({
        name,
        node,
        kind,
        parent,
        documentation: getDocumentation(checker, node),
        typeInfo: getPropTypeInfo(checker, node, type),
      });
    } else if (isExpressionWithTypeArguments(node)) {
      clauseToMeta(node.expression as Identifier | CallExpression);
    } else if (isCallExpression(node)) {
      clauseToMeta(node.expression as Identifier);
      if (node.arguments[0]) clauseToMeta(node.arguments[0] as CallExpression);
    }
  };

  const heritageClauses =
    ((declaration as unknown) as
      | ClassDeclaration
      | ClassExpression
      | InterfaceDeclaration).heritageClauses ?? factory.createNodeArray();

  heritageClauses.forEach(clause => {
    clause.types.forEach(node => {
      clauseToMeta(node);
    });
  });

  return heritage;
}
