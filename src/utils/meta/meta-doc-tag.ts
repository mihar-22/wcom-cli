import { bold } from 'kleur';
import { Node } from 'typescript';

import { DocTagMeta } from '../../plugins/ComponentMeta';
import { arrayOnlyUnique } from '../../utils/array';
import { LogLevel, reportDiagnosticByNode } from '../../utils/log';

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export function splitJsDocTagText(tag: DocTagMeta) {
  const [title, description] = (tag.text?.split(' - ') ?? []).map(s =>
    s.trim(),
  );
  return {
    title: !description ? undefined : title,
    description: !description ? title : description,
    node: tag.node,
  };
}

export const getDocTags = (node: Node): DocTagMeta[] =>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ((node as any).jsDoc?.[0]?.tags ?? []).map((docTagNode: any) => ({
    node: docTagNode,
    name: docTagNode.tagName.escapedText,
    text: docTagNode.comment,
  }));

export const findDocTag = (
  tags: DocTagMeta[],
  name: string,
): DocTagMeta | undefined => tags.find(tag => tag.name === name);

export const hasDocTag = (tags: DocTagMeta[], name: string): boolean =>
  tags.some(tag => tag.name === name);

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export function buildAnyMetaFromDocTags(
  docTags: DocTagMeta[],
  tagName: string,
  example: string,
) {
  const tags = docTags
    .filter(tag => tag.name === tagName)
    .map(tag => splitJsDocTagText(tag));

  return arrayOnlyUnique(
    tags,
    'title',
    tag => {
      reportDiagnosticByNode(
        `Found duplicate \`@${tagName}\` tags with the name \`${tag.title}\`.`,
        tag.node,
        LogLevel.Warn,
      );
    },
    true,
  ).map(tag => {
    if (!tag.title) {
      reportDiagnosticByNode(
        [
          `Tag \`@${tagName}\` is missing a title.`,
          `\n${bold('EXAMPLE')}\n\n${example}`,
        ].join('\n'),
        tag.node,
        LogLevel.Warn,
      );
    }

    if (tag.title && !tag.description) {
      reportDiagnosticByNode(
        [
          `Tag \`@${tagName}\` is missing a description.`,
          `\n${bold('EXAMPLE')}\n\n${example}`,
        ].join('\n'),
        tag.node,
        LogLevel.Warn,
      );
    }

    return {
      name: tag.title ?? '',
      description: tag.description ?? '',
      node: tag.node,
    };
  });
}
