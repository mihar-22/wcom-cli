import { blue, bold, yellow } from 'kleur';
import { Node, SourceFile, TypeChecker } from 'typescript';

import { ComponentMeta, HeritageMeta } from '../../../plugins/ComponentMeta';
import { Plugin } from '../../../plugins/Plugin';
import { mergeComponentMeta } from '../../../utils/component';
import { log, LogLevel, logWithTime } from '../../../utils/log';
import { buildHeritageMeta, buildHeritageMetaTree } from '../../../utils/meta';
import { sortObjectsBy } from '../../../utils/object';
import { validateUniqueTagNames } from '../../../utils/tags';
import { isUndefined } from '../../../utils/unit';

export async function discoverAndBuild(
  checker: TypeChecker,
  plugins: Plugin[],
  sourceFiles: SourceFile[],
): Promise<ComponentMeta[]> {
  const components: ComponentMeta[] = [];

  for (let p = 0; p < plugins.length; p += 1) {
    const plugin = plugins[p];
    if (isUndefined(plugin.discover) || isUndefined(plugin.build)) continue;

    // Discover.
    const discoveries: Node[] = [];
    const totalDiscoveryStartTime = process.hrtime();

    for (let i = 0; i < sourceFiles.length; i += 1) {
      const sourceFile = sourceFiles[i];
      const discoverStartTime = process.hrtime();
      const discoveredNodes = (await plugin.discover(sourceFile)) ?? [];
      discoveredNodes.forEach(node => discoveries.push(node));
      logWithTime(
        `[${yellow(plugin.name)}] Discovered ${bold(
          discoveredNodes.length,
        )} components at ${blue(sourceFile.fileName)}`,
        discoverStartTime,
        LogLevel.Verbose,
      );
    }

    logWithTime(
      `[${yellow(plugin.name)}] \`discover\``,
      totalDiscoveryStartTime,
    );

    // Build.
    const totalBuildStartTime = process.hrtime();

    for (let i = 0; i < discoveries.length; i += 1) {
      const discovery = discoveries[i];
      const buildStartTime = process.hrtime();
      const build = await buildComponentMetaWithHeritage(
        checker,
        plugin,
        discovery,
      );
      components.push(build);
      logWithTime(
        `[${yellow(plugin.name)}] Built meta for ${blue(build.tagName ?? '')}`,
        buildStartTime,
        LogLevel.Verbose,
      );
    }

    logWithTime(`[${yellow(plugin.name)}] \`build\``, totalBuildStartTime);
  }

  // Postbuild.
  let postbuildComponents = components;
  for (let p = 0; p < plugins.length; p += 1) {
    const plugin = plugins[p];
    if (isUndefined(plugin.postbuild)) continue;
    const startTime = process.hrtime();
    postbuildComponents = await plugin.postbuild(
      postbuildComponents,
      sourceFiles,
    );
    logWithTime(`[${yellow(plugin.name)}] \`postbuild\``, startTime);
  }

  // Merge.
  const mergedComponents: ComponentMeta[] = [];
  const hasMerged = new Set<string>();
  postbuildComponents.forEach(component => {
    if (isUndefined(component.tagName)) {
      mergedComponents.push(component);
      return;
    }

    if (hasMerged.has(component.tagName)) {
      return;
    }

    const similarComponents = postbuildComponents.filter(
      c => c.tagName === component.tagName,
    );

    if (similarComponents.length === 1) {
      mergedComponents.push(similarComponents[0]);
      return;
    }

    log(
      `Found ${bold(similarComponents.length)} components with tagname ${blue(
        component.tagName,
      )}`,
      LogLevel.Warn,
    );

    let mergedComponent = similarComponents[0];
    similarComponents.slice(1).forEach(s => {
      mergedComponent = mergeComponentMeta(mergedComponent, s);
    });
    mergedComponents.push(mergedComponent);
    hasMerged.add(component.tagName);
  });

  const sortedComponents = sortObjectsBy(mergedComponents, 'tagName');
  validateUniqueTagNames(sortedComponents);
  return sortedComponents;
}

export async function buildComponentMetaWithHeritage<T extends Node>(
  checker: TypeChecker,
  plugin: Plugin,
  node: T,
  parent?: HeritageMeta,
): Promise<ComponentMeta> {
  const component = (await plugin.build!(node))!;

  component.heritage = [
    ...(component.heritage ?? []),
    ...(await buildHeritageMetaTree(
      checker,
      plugin,
      buildHeritageMeta(checker, node, parent),
    )),
  ];

  return component;
}
