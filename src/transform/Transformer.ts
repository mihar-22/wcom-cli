import { ComponentMeta } from '../discover/ComponentMeta';

export enum TransformerId {
  Json = 'json',
  VsCode = 'vscode',
  Types = 'types',
  Markdown = 'markdown',
  React = 'react',
  Vue = 'vue',
  VueNext = 'vue-next',
  Svelte = 'svelte',
  Angular = 'angular',
  ALL = 'all',
}

export interface Transformer<ConfigType = any> {
  transform(components: ComponentMeta[], config: ConfigType): Promise<void>
}
