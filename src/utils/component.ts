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
import { isArray, isBoolean, isUndefined } from './unit';

export type MergeableComponentMetaPart =
  | PropMeta
  | DocTagMeta
  | MethodMeta
  | EventMeta
  | CssPropMeta
  | CssPartMeta
  | ComponentMeta;

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

  mergeKeys.forEach(key => {
    if (isUndefined(x[key])) return;

    (x[key] as MergeableComponentMetaPart[]).forEach(mx => {
      const my = (y[key] as MergeableComponentMetaPart[]).find(
        m =>
          m.name === mx.name ||
          (!isUndefined((m as ComponentMeta).tagName) &&
            (m as ComponentMeta).tagName === (mx as ComponentMeta).tagName),
      );

      if (!isUndefined(my)) {
        // Means it's already included in `dependencies[]` so skip.
        if (!isUndefined((my as ComponentMeta).tagName)) {
          return;
        }

        keysOfObject(mx).forEach(subKey => {
          if (isArray(mx[subKey])) {
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            y[subKey] = [...mx[subKey], ...my[subKey]];
          } else if (isBoolean(mx[subKey]) && !my[subKey]) {
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            my[subKey] = mx[subKey];
          }
        });
      } else {
        (y[key] as MergeableComponentMetaPart[]).push(mx);
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
