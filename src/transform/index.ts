import { TransformCommandConfig } from '../cli/commands/transform/TransformCommandConfig';
import { ComponentMeta } from '../discover/ComponentMeta';
import { TransformerId, Transformer, TransformerConstructor } from './Transformer';
import { AngularTransformer } from './transformers/angular/AngularTransformer';
import { JsonTransformer } from './transformers/json/JsonTransformer';
import { MarkdownTransformer } from './transformers/markdown/MarkdownTransformer';
import { ReactTransformer } from './transformers/react/ReactTransformer';
import { SvelteTransformer } from './transformers/svelte/SvelteTransformer';
import { TypesTransformer } from './transformers/types/TypesTransformer';
import { VsCodeTransformer } from './transformers/vscode/VsCodeTransformer';
import { VueTransformer } from './transformers/vue/VueTransformer';
import { VueNextTransformer } from './transformers/vue-next/VueNextTransformer';

const BUILD_CACHE = new Map<TransformerId, Transformer>();

export function transform(
  components: ComponentMeta[],
  transformerId: TransformerId,
  config: TransformCommandConfig,
) {
  const transformers = transformerFactory(transformerId, config);
  transformers.forEach((transformer) => { transformer.transform(components); });
}

function transformerFactory(id: TransformerId, config: TransformCommandConfig) {
  const transformers: Transformer[] = [];

  if (id === TransformerId.ALL) {
    Object.values(TransformerId)
      .filter((transformer) => transformer !== TransformerId.ALL)
      .forEach((transformer) => { transformers.push(buildTransformer(transformer, config)); });
  } else {
    transformers.push(buildTransformer(id, config));
  }

  return transformers;
}

function buildTransformer(id: TransformerId, config: TransformCommandConfig) {
  if (BUILD_CACHE.has(id)) return BUILD_CACHE.get(id)!;

  let TransformerCtor: TransformerConstructor;

  switch (id) {
    case TransformerId.Json:
      TransformerCtor = JsonTransformer;
      break;
    case TransformerId.Vscode:
      TransformerCtor = VsCodeTransformer;
      break;
    case TransformerId.Types:
      TransformerCtor = TypesTransformer;
      break;
    case TransformerId.Markdown:
      TransformerCtor = MarkdownTransformer;
      break;
    case TransformerId.Angular:
      TransformerCtor = AngularTransformer;
      break;
    case TransformerId.React:
      TransformerCtor = ReactTransformer;
      break;
    case TransformerId.Svelte:
      TransformerCtor = SvelteTransformer;
      break;
    case TransformerId.Vue:
      TransformerCtor = VueTransformer;
      break;
    case TransformerId.VueNext:
      TransformerCtor = VueNextTransformer;
      break;
    default:
      TransformerCtor = JsonTransformer;
      break;
  }

  const transformer = new TransformerCtor({ ...config });
  BUILD_CACHE.set(id, transformer);
  return transformer;
}
