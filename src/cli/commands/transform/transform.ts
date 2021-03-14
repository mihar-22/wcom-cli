import * as fsExtra from 'fs-extra';
import { yellow } from 'kleur';

import { ComponentMeta } from '../../../plugins/ComponentMeta';
import { Plugin } from '../../../plugins/Plugin';
import { logWithTime } from '../../../utils/log';
import {
  resolveConfigPaths,
  resolvePath,
  resolveRelativePath,
} from '../../../utils/resolve';
import { isUndefined } from '../../../utils/unit';

export async function transform(
  plugins: Plugin[],
  components: ComponentMeta[],
): Promise<void> {
  for (let p = 0; p < plugins.length; p += 1) {
    const plugin = plugins[p];
    if (isUndefined(plugin.transform)) continue;
    const startTime = process.hrtime();
    await plugin.transform(components, {
      ...fsExtra,
      resolvePath,
      resolveRelativePath,
      resolveConfigPaths,
    });
    logWithTime(`[${yellow(plugin.name)}] \`transform\``, startTime);
  }
}
