import { DiscovererId } from '../../../discover/Discoverer';
import { TransformerId } from '../../../transform/Transformer';
import { AngularTransformerConfig } from '../../../transform/transformers/angular/AngularTransformerConfig';
import { ExportsTransformerConfig } from '../../../transform/transformers/exports/ExportsTransformerConfig';
import { JsonTransformerConfig } from '../../../transform/transformers/json/JsonTransformerConfig';
import { MarkdownTransformerConfig } from '../../../transform/transformers/markdown/MarkdownTransformerConfig';
import { ReactTransformerConfig } from '../../../transform/transformers/react/ReactTransformerConfig';
import { SvelteTransformerConfig } from '../../../transform/transformers/svelte/SvelteTransformerConfig';
import { TypesTransformerConfig } from '../../../transform/transformers/types/TypesTransformerConfig';
import { VsCodeTransformerConfig } from '../../../transform/transformers/vscode/VsCodeTransformerConfig';
import { VueTransformerConfig } from '../../../transform/transformers/vue/VueTransformerConfig';

export interface TransformCommandConfig extends
  AngularTransformerConfig,
  JsonTransformerConfig,
  MarkdownTransformerConfig,
  ReactTransformerConfig,
  SvelteTransformerConfig,
  TypesTransformerConfig,
  VsCodeTransformerConfig,
  VueTransformerConfig,
  ExportsTransformerConfig {
  discovery: DiscovererId;
  transformers: TransformerId[];
  logLevel: string;
  dry: boolean;
  watch: boolean;
  glob?: string[];
  globs?: string[];
  cwd: string;
  project: string;
}
