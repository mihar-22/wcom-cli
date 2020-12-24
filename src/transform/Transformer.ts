import { ComponentMeta } from '../discover/ComponentMeta';

export enum TransformerId {
  Json = 'json',
  Vscode = 'vscode',
  Types = 'types',
  Markdown = 'markdown',
  React = 'react',
  Vue = 'vue',
  VueNext = 'vue-next',
  Svelte = 'svelte',
  Angular = 'angular',
  ALL = 'all',
}

export interface TransformerConstructor<ConfigType = any> {
  new(config: ConfigType): Transformer;
}

export interface Transformer {
  transform(components: ComponentMeta[]): void
}
