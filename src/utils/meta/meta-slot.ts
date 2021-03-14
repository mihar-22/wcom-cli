import { bold } from 'kleur';

import { DocTagMeta, SlotMeta } from '../../plugins/ComponentMeta';
import { arrayOnlyUnique } from '../../utils/array';
import { LogLevel, reportDiagnosticByNode } from '../../utils/log';
import { splitJsDocTagText } from './meta-doc-tag';

export function buildSlotMetaFromDocTags(tags: DocTagMeta[]): SlotMeta[] {
  let defaultSlots = 0;
  let hasSeenDefaultSlot = false;

  const slots = tags
    .filter(tag => tag.name === 'slot')
    .map(tag => splitJsDocTagText(tag));

  return arrayOnlyUnique(
    slots,
    'title',
    slot => {
      reportDiagnosticByNode(
        `Found duplicate \`@slot\` tags with the name \`${slot.title}\`.`,
        slot.node,
        LogLevel.Warn,
      );
    },
    true,
  ).map(slot => {
    const isDefault = !slot.title;

    if (isDefault && hasSeenDefaultSlot) {
      reportDiagnosticByNode(
        [
          'Non default `@slot` tag is missing a title.',
          `\n${bold(
            'EXAMPLE',
          )}\n\n@slot body - Used to pass in the body of this component.`,
        ].join('\n'),
        slot.node,
        LogLevel.Warn,
      );
    }

    if (isDefault) {
      defaultSlots += 1;
      hasSeenDefaultSlot = true;
    }

    return {
      name: slot.title ?? '',
      default: isDefault && defaultSlots === 1,
      description: slot.description ?? '',
      node: slot.node,
    };
  });
}
