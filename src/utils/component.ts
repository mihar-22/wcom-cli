import {
  ComponentMeta,
  CssPartMeta,
  CssPropMeta,
  DocTagMeta,
  EventMeta,
  HeritageMeta,
  InterfaceMeta,
  MethodMeta,
  PropMeta,
} from '../plugins/ComponentMeta';
import { keysOfObject, sortObjectsBy } from './object';
import { isBoolean, isUndefined } from './unit';

export type MergeableComponentMetaPart =
  | PropMeta
  | DocTagMeta
  | MethodMeta
  | EventMeta
  | CssPropMeta
  | CssPartMeta
  | ComponentMeta;

/**
 * Merges `x` into `y` in-place. `y` will take precedence when meta exists in both `x` and `y`.
 */
export function mergeComponentMeta(
  x: Partial<ComponentMeta>,
  y: ComponentMeta,
): ComponentMeta {
  const mergeKeys = new Set<keyof ComponentMeta>([
    'props',
    'docTags',
    'methods',
    'events',
    'cssProps',
    'cssParts',
    'dependencies',
  ]);

  mergeKeys.forEach(componentMetaKey => {
    if (isUndefined(x[componentMetaKey])) return;

    const xMetas = x[componentMetaKey] as MergeableComponentMetaPart[];
    const yMetas = y[componentMetaKey] as MergeableComponentMetaPart[];

    xMetas.forEach(xMeta => {
      const yMeta = yMetas.find(
        m =>
          m.name === xMeta.name ||
          (!isUndefined((m as ComponentMeta).tagName) &&
            (m as ComponentMeta).tagName === (xMeta as ComponentMeta).tagName),
      );

      if (!isUndefined(yMeta)) {
        // Means it's already included in `dependencies[]` so skip.
        if (!isUndefined((yMeta as ComponentMeta).tagName)) {
          return;
        }

        keysOfObject(xMeta).forEach(partKey => {
          if ((partKey as keyof PropMeta) === 'docTags') {
            const xDocTags = xMeta[partKey] as DocTagMeta[];
            const yDocTags = yMeta[partKey] as DocTagMeta[];

            xDocTags.forEach(xTag => {
              const yTag = yDocTags.find(yTag => yTag.name === xTag.name);
              if (isUndefined(yTag)) {
                yDocTags.push(xTag);
              }
            });
          } else if (
            (partKey as keyof PropMeta) === 'documentation' &&
            isUndefined(yMeta[partKey])
          ) {
            (yMeta[partKey] as string) = xMeta[partKey] as string;
          } else if (isBoolean(xMeta[partKey]) && !yMeta[partKey]) {
            (yMeta[partKey] as boolean) = xMeta[partKey] as boolean;
          }
        });
      } else {
        yMetas.push(xMeta);
      }
    });
  });

  return y;
}

export function sortComponentMeta(
  components: ComponentMeta[],
): ComponentMeta[] {
  components.forEach(c => {
    c.props = sortObjectsBy(c.props, 'name');
    c.methods = sortObjectsBy(c.methods, 'name');
    c.events = sortObjectsBy(c.events, 'name');
    c.cssParts = sortObjectsBy(c.cssParts, 'name');
    c.cssProps = sortObjectsBy(c.cssProps, 'name');
    c.docTags = sortObjectsBy(c.docTags, 'name');
    c.slots = sortObjectsBy(c.slots, 'name');
    c.dependents = sortObjectsBy(c.dependents, 'tagName');
    c.dependencies = sortObjectsBy(c.dependencies, 'tagName');
  });

  return sortObjectsBy(components, 'tagName');
}

export function traverseHeritageTree(
  heritages: HeritageMeta[],
  callback: (heritage: HeritageMeta) => void,
): void {
  heritages.forEach(heritage => {
    callback(heritage);

    let next: ComponentMeta | InterfaceMeta | undefined;

    if (!isUndefined(heritage.component)) {
      next = heritage.component;
    } else if (!isUndefined(heritage.interface)) {
      next = heritage.interface;
    } else if (!isUndefined(heritage.mixin)) {
      next = heritage.mixin;
    }

    if (!isUndefined(next?.heritage) && next!.heritage.length > 0) {
      traverseHeritageTree(next!.heritage, callback);
    }
  });
}

// TODO: might need later, keep for now.
// export function buildDependencyMap(components: ComponentMeta[]): void {
//   const map = new Map<string, ComponentMeta>();
//   const paths = new Set<string>();

//   const trimFileExt = (input: string) => input.replace(/\.[^/.]+$/, '');

//   components.forEach(component => {
//     const path = trimFileExt(component.source.filePath);
//     map.set(path, component);
//     paths.add(path);
//   });

//   components.forEach(component => {
//     const { source } = component;
//     const sourceDir = dirname(source.filePath);
//     source.file.statements.filter(isImportDeclaration).forEach(importStmt => {
//       const relativeImportPath = escapeQuotes(
//         importStmt.moduleSpecifier.getText(),
//       );
//       let absolutePathToImport = resolve(sourceDir, relativeImportPath);

//       if (absolutePathToImport.endsWith('ts')) {
//         absolutePathToImport = trimFileExt(absolutePathToImport);
//       }

//       if (paths.has(absolutePathToImport)) {
//         const dependency = map.get(absolutePathToImport)!;

//         if (!component.dependencies.includes(dependency)) {
//           component.dependencies.push(dependency);
//         }

//         if (!dependency.dependents.includes(component)) {
//           dependency.dependents.push(component);
//         }
//       }
//     });
//   });
// }
