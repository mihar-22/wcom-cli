import { TransformCommandConfig } from '../cli/commands/transform/TransformCommandConfig';
import { log, LogLevel } from '../core/log';
import { ComponentMeta } from '../discover/ComponentMeta';
import { TransformerId, Transformer } from './Transformer';
import { AngularTransformer } from './transformers/angular/AngularTransformer';
import { ExportsTransformer } from './transformers/exports/ExportsTransformer';
import { JsonTransformer } from './transformers/json/JsonTransformer';
import { MarkdownTransformer } from './transformers/markdown/MarkdownTransformer';
import { ReactTransformer } from './transformers/react/ReactTransformer';
import { SvelteTransformer } from './transformers/svelte/SvelteTransformer';
import { TypesTransformer } from './transformers/types/TypesTransformer';
import { VsCodeTransformer } from './transformers/vscode/VsCodeTransformer';
import { VueTransformer } from './transformers/vue/VueTransformer';

export type TransformerMapper = {
  [id in TransformerId]: Transformer | undefined
};

export const TransformerMap: TransformerMapper = Object.freeze({
  [TransformerId.Angular]: AngularTransformer,
  [TransformerId.Json]: JsonTransformer,
  [TransformerId.Types]: TypesTransformer,
  [TransformerId.Exports]: ExportsTransformer,
  [TransformerId.Markdown]: MarkdownTransformer,
  [TransformerId.React]: ReactTransformer,
  [TransformerId.Svelte]: SvelteTransformer,
  [TransformerId.VsCode]: VsCodeTransformer,
  [TransformerId.Vue]: VueTransformer,
  [TransformerId.ALL]: undefined,
});

const AllTransformers = Object.keys(TransformerMap)
  .filter((key) => key !== TransformerId.ALL)
  .map((key) => TransformerMap[key as TransformerId]);

export async function transform(
  components: ComponentMeta[],
  transformerId: TransformerId,
  config: TransformCommandConfig,
): Promise<void> {
  log(() => `Starting ${transformerId} transformation`, LogLevel.Verbose);

  if (transformerId === TransformerId.ALL) {
    await Promise.all(AllTransformers
      .map((transformer) => transformer!.transform(components, config)));
    return;
  }

  await TransformerMap[transformerId]!.transform(components, config);
  log(() => `Finished ${transformerId} transformation`, LogLevel.Verbose);
}
