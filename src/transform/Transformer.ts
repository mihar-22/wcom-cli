import { ComponentMeta } from '../discover/ComponentMeta';

export enum TransformerId {
  Json = 'json',
  VsCode = 'vscode',
  Types = 'types',
  Exports = 'exports',
  Markdown = 'markdown',
  ALL = 'all',
}

export interface Transformer<ConfigType = any> {
  transform(components: ComponentMeta[], config: ConfigType): Promise<void>
}
