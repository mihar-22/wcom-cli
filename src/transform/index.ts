import { bold } from 'kleur';

import { TransformCommandConfig } from '../cli/commands/transform/TransformCommandConfig';
import { log, LogLevel, logWithTime } from '../core/log';
import { ComponentMeta } from '../discover/ComponentMeta';
import { Transformer, TransformerId } from './Transformer';
import { ExportsTransformer } from './transformers/exports/ExportsTransformer';
import { JsonTransformer } from './transformers/json/JsonTransformer';
import { MarkdownTransformer } from './transformers/markdown/MarkdownTransformer';
import { TypesTransformer } from './transformers/types/TypesTransformer';
import { VsCodeTransformer } from './transformers/vscode/VsCodeTransformer';

export type TransformerMapper = {
  [id in TransformerId]: Transformer | undefined;
};

export const TransformerMap: TransformerMapper = Object.freeze({
  [TransformerId.Json]: JsonTransformer,
  [TransformerId.Types]: TypesTransformer,
  [TransformerId.Exports]: ExportsTransformer,
  [TransformerId.Markdown]: MarkdownTransformer,
  [TransformerId.VsCode]: VsCodeTransformer,
  [TransformerId.ALL]: undefined,
});

const AllTransformers = Object.keys(TransformerMap)
  .filter(key => key !== TransformerId.ALL)
  .map(key => TransformerMap[key as TransformerId]);

export async function transform(
  components: ComponentMeta[],
  transformerId: TransformerId,
  config: TransformCommandConfig,
): Promise<void> {
  log(`Starting ${bold(transformerId)} transformation`, LogLevel.Verbose);

  const startTime = process.hrtime();

  if (transformerId === TransformerId.ALL) {
    await Promise.all(
      AllTransformers.map(transformer =>
        transformer?.transform(components, config),
      ),
    );
    return;
  }

  await TransformerMap[transformerId]?.transform(components, config);
  logWithTime(
    `Finished ${bold(transformerId)} transformation`,
    startTime,
    LogLevel.Verbose,
  );
}
