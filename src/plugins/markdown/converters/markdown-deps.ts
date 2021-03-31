import { relative } from 'path';

import { isUndefined } from '../../../utils/unit';
import { ComponentMeta } from '../../ComponentMeta';

function getDependencyLink(
  component: ComponentMeta,
  depTagName: string,
  components: ComponentMeta[],
): string {
  const dependency = components.find(c => c.tagName === depTagName);

  if (dependency) {
    const relativePathToDependency = relative(
      component.source.dirPath,
      dependency.source.dirPath,
    );

    return `[${depTagName}](${relativePathToDependency})`;
  }

  return depTagName;
}

export function depsToMarkdown(
  component: ComponentMeta,
  components: ComponentMeta[],
): string[] {
  const content: string[] = [];
  const hasDependents = component.dependents.length > 0;
  const hasDependencies = component.dependencies.length > 0;

  if (!hasDependencies && !hasDependents) return content;

  content.push('## Dependencies');
  content.push('');

  if (hasDependents) {
    const usedBy = component.dependents
      .filter(dependent => !isUndefined(dependent.tagName))
      .map(dependent => dependent.tagName)
      .map(
        tagName => ` - ${getDependencyLink(component, tagName!, components)}`,
      );

    content.push('### Used by');
    content.push('');
    content.push(...usedBy);
    content.push('');
  }

  if (hasDependencies) {
    const dependsOn = component.dependencies
      .filter(dependency => !isUndefined(dependency.tagName))
      .map(dependency => dependency.tagName)
      .map(
        tagName => ` - ${getDependencyLink(component, tagName!, components)}`,
      );

    content.push('### Depends on');
    content.push('');
    content.push(...dependsOn);
    content.push('');
  }

  content.push('');

  return content;
}
