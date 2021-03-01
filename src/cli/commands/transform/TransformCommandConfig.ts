import { DiscovererId } from '../../../discover/Discoverer';
import { TransformerId } from '../../../transform/Transformer';

export interface TransformCommandConfig
  extends JsonTransformerConfig,
    MarkdownTransformerConfig,
    TypesTransformerConfig,
    VsCodeTransformerConfig,
    ExportsTransformerConfig,
    Record<string, unknown> {
  pkgName: string;
  discovery: DiscovererId;
  transformers: TransformerId[];
  logLevel: string;
  dry: boolean;
  glob?: string[];
  globs?: string[];
  cwd: string;
  // watch: boolean;
  // project: string;
}

export interface JsonTransformerConfig {
  jsonOutFile: string;
}

export interface MarkdownTransformerConfig {
  componentsRootDir: string;
  markdownOutDir: string;
  noMarkdownIndex: boolean;
  markdownIndexOutFile: string;
}

export interface TypesTransformerConfig {
  pkgName: string;
  watch: boolean;
  typesOutFile: string;
}

export interface VsCodeTransformerConfig {
  vscodeOutFile: string;
}

export interface ExportsTransformerConfig {
  exportsOutFile: string;
}
