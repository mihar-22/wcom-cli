import { dirname, relative } from 'path';
import { ComponentMeta } from '../../../../discover/ComponentMeta';

const getDependencyLink = (
  component: ComponentMeta,
  depTagName: string,
  components: ComponentMeta[],
) => {
  const dependency = components.find((c) => c.tagName === depTagName);

  if (dependency) {
    const relativePathToDependency = relative(
      dirname(component.source.filePath),
      dirname(dependency.source.filePath)!,
    ).replace('../', './');

    return `[${depTagName}](${relativePathToDependency})`;
  }

  return depTagName;
};

export const depsToMarkdown = (
  component: ComponentMeta,
  components: ComponentMeta[],
) => {
  const content: string[] = [];
  const hasDependents = component.dependents.length > 0;
  const hasDependencies = component.dependencies.length > 0;

  if (!hasDependencies || !hasDependents) return content;

  content.push('## Dependencies');
  content.push('');

  if (hasDependents) {
    const usedBy = component.dependents
      .map((dependent) => dependent.tagName)
      .map((tagName) => ` - ${getDependencyLink(component, tagName, components)}`);

    content.push('### Used by');
    content.push('');
    content.push(...usedBy);
    content.push('');
  }

  if (hasDependencies) {
    const dependsOn = component.dependencies
      .map((dependency) => dependency.tagName)
      .map((tagName) => ` - ${getDependencyLink(component, tagName, components)}`);

    content.push('### Depends on');
    content.push('');
    content.push(...dependsOn);
    content.push('');
  }

  content.push('');

  return content;
};
