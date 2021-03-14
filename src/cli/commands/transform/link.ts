import { yellow } from 'kleur';
import { SourceFile } from 'typescript';

import { ComponentMeta, HeritageMeta } from '../../../plugins/ComponentMeta';
import { Plugin } from '../../../plugins/Plugin';
import {
  mergeComponentMeta,
  sortComponentMeta,
  traverseHeritageTree,
} from '../../../utils/component';
import { logWithTime } from '../../../utils/log';
import { isUndefined } from '../../../utils/unit';

export async function link(
  plugins: Plugin[],
  components: ComponentMeta[],
  sourceFiles: SourceFile[],
): Promise<ComponentMeta[]> {
  const linkedComponents: ComponentMeta[] = components;
  const heritages = new Map<ComponentMeta, HeritageMeta[]>();

  // Traverse heritage tree for each component and store as an array.
  components.forEach(component => {
    const completeHeritage: HeritageMeta[] = [];
    traverseHeritageTree(component.heritage, heritage => {
      completeHeritage.push(heritage);
    });
    heritages.set(component, completeHeritage);
  });

  // Base link.
  const baseLinkStartTime = process.hrtime();
  for (let i = 0; i < components.length; i += 1) {
    const component = components[i];
    const tree = heritages.get(component) ?? [];
    for (let j = 0; j < tree.length; j += 1) {
      linkedComponents[i] = baseLink(component, tree[j]);
    }
  }
  logWithTime(`[${yellow('wcom')}] \`link\``, baseLinkStartTime);

  // Link.
  for (let p = 0; p < plugins.length; p += 1) {
    const plugin = plugins[p];
    if (isUndefined(plugin.link)) continue;
    const startTime = process.hrtime();

    for (let i = 0; i < components.length; i += 1) {
      const component = components[i];
      const tree = heritages.get(component) ?? [];
      for (let j = 0; j < tree.length; j += 1) {
        linkedComponents[i] = await plugin.link(component, tree[j]);
      }
    }

    logWithTime(`[${yellow(plugin.name)}] \`link\``, startTime);
  }

  // Postlink.
  let postLinkedComponents: ComponentMeta[] = linkedComponents;
  for (let p = 0; p < plugins.length; p += 1) {
    const plugin = plugins[p];
    if (isUndefined(plugin.postlink)) continue;
    const startTime = process.hrtime();
    postLinkedComponents = await plugin.postlink(
      postLinkedComponents,
      sourceFiles,
    );
    logWithTime(`[${yellow(plugin.name)}] \`postlink\``, startTime);
  }

  return sortComponentMeta(postLinkedComponents);
}

function baseLink(
  component: ComponentMeta,
  heritage: HeritageMeta,
): ComponentMeta {
  const merge = heritage.component ?? heritage.mixin ?? heritage.interface;

  if (!isUndefined(merge)) {
    const { props, methods, docTags } = merge;
    const { events, cssProps, cssParts, dependencies } = merge as ComponentMeta;

    const meta = {
      props,
      docTags,
      methods,
      events,
      cssProps,
      cssParts,
      dependencies,
    };

    return mergeComponentMeta(meta, component);
  }

  return component;
}
