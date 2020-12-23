export enum Transformer {
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

export enum Discoverer {
  Lit = 'lit',
}

export interface TransformCommandConfig {
  [id: string]: any
  discoverer: Discoverer
  transformers: Transformer[]
  logLevel: string
  dry: boolean
  watch: boolean
  globs?: string[]
  cwd: string
  jsonOutFile: string
  vscodeOutFile: string
  typesOutFile: string
  reactOutDir: string
  markdownOutDir: string
  vueOutDir: string
  vueNextOutDir: string
  svelteOutputDir: string
  angularOutputDir: string
}
