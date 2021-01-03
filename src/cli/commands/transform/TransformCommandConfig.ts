import { DiscovererId } from '../../../discover/Discoverer';
import { TransformerId } from '../../../transform/Transformer';
import { ExportsTransformerConfig } from '../../../transform/transformers/exports/ExportsTransformerConfig';
import { JsonTransformerConfig } from '../../../transform/transformers/json/JsonTransformerConfig';
import { MarkdownTransformerConfig } from '../../../transform/transformers/markdown/MarkdownTransformerConfig';
import { TypesTransformerConfig } from '../../../transform/transformers/types/TypesTransformerConfig';
import { VsCodeTransformerConfig } from '../../../transform/transformers/vscode/VsCodeTransformerConfig';

export interface TransformCommandConfig extends
  JsonTransformerConfig,
  MarkdownTransformerConfig,
  TypesTransformerConfig,
  VsCodeTransformerConfig,
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
