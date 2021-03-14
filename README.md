# @wcom/cli

[![package-badge]][package]
[![license-badge]][license]
[![semantic-release-badge]][semantic-release]

[package]: https://www.npmjs.com/package/@wcom/cli
[package-badge]: https://img.shields.io/npm/v/@wcom/cli
[license]: https://github.com/mihar-22/wcom-cli/blob/main/LICENSE
[license-badge]: https://img.shields.io/github/license/mihar-22/wcom-cli
[semantic-release]: https://github.com/semantic-release/semantic-release
[semantic-release-badge]: https://img.shields.io/badge/%20%20%F0%9F%93%A6%F0%9F%9A%80-semantic--release-e10079.svg

## Table of Contents

- [Introduction](#introduction)
- [Install](#install)
- [Usage](#usage)
- [Documenting Components](#documenting-components)
  - [Custom Metadata](#custom-metadata)
- [Plugins](#plugins)
  - [Custom Plugin](#custom-plugin)

## Introduction

This is a lightweight CLI tool that parses your JavaScript/TypeScript files and collects
[metadata](./src/plugins/ComponentMeta.ts) about your Web Components via plugins, which can then
be used again via plugins to transform it into whatever output you require such as JSON or
Markdown.

Metadata includes the properties, methods, events, cssprops, cssparts, slots and more about each
component. This tool works completely off plugins so there's not much underlying logic out of the
box. Pick, use and create what you need. See below on [how to create your own plugin](#plugins).

The following are some plugins available out of the box:

- **Lit Element:** Discovers metadata about your LitElement components (only TS support atm).
  Follows complete heritage tree (mixins/subclasses/interfaces).
- **JSON:** Transforms component metadata into JSON format and outputs it to a chosen file.
- **Markdown:** Transforms component metadata into markdown and outputs it to chosen paths.
- **VSCode Custom Data:** Transforms component metadata into [VSCode Custom Data](https://github.com/microsoft/vscode-custom-data)
  and outputs it to a chosen file.

## Install

```bash
# npm
$: npm install @wcom/cli -D

# yarn
$: yarn add @wcom/cli -D

# pnpm
$: pnpm install @wcom/cli -D
```

## Usage

First create a `wcom.config.ts` file at the root your project directory and include some plugins...

```ts
// wcom.config.ts

// Hover over each plugin here in your editor to see what options are available.
import { litPlugin, markdownPlugin, vscodePlugin, jsonPlugin } from '@wcom/cli';

export default [litPlugin(), markdownPlugin(), vscodePlugin(), jsonPlugin()];
```

Next simply run the `transform` command...

```bash
$: wcom transform src/**/*.ts
```

For more information call `wcom transform -h` to see what arguments are available.

## Documenting Components

Here's an example of how you can document a component using our `litPlugin`...

````ts
/**
 * Description about my component here.
 *
 * @tagname my-component
 *
 * @slot Used to pass in additional content inside (default slot).
 * @slot another-slot - Used to pass content into another part.
 *
 * @csspart root - The component's root element.
 *
 * @cssprop --my-component-bg - The background color of the component.
 *
 * @example
 * ```html
 * <my-component></my-component>
 * ```
 *
 * @example
 * ```html
 * <!-- Hidden. -->
 * <my-component hidden></my-component>
 * ```
 */
export class MyComponent extends LitElement {
  /**
   * Whether the component is hidden.
   */
  @property({ type: Boolean }) hidden = false;

  /**
   * The size of the component.
   *
   * @deprecated - Use `size` instead.
   */
  @property({ attribute: 'size' }) sizing: 'small' | 'big' = 'small';

  /**
   * The current size of the component - example of a `readonly` property.
   */
  get currentSize(): 'small' | 'big' {
    return this.size;
  }

  /**
   * Call this method to show the component.
   */
  onShow() {
    // ...
  }

  /**
   * `protected` and `private` methods will not be included in `ComponentMeta`.
   *
   * You can also hide metadata by adding the following tag...
   *
   * @internal - For private use... don't touch!
   */
  protected internalMethod() {
    // ...
  }
}
````

### Custom Metadata

You might've noticed that some information such as events were missing, and there may
potentially be other information you'd like to include in the final output. In these cases it'd be
best to create your own plugin and extract the information you need. Depending on what you're
gathering the `postbuild` and `postlink` plugin lifecycle steps are generally the best time to do
this. See the next section for more information on how you can go about achieving this with
[custom plugins](#custom-plugin).

## Plugins

```ts
/**
 * Don't be scared by the interface, you can achieve simple things really easily. All
 * lifecycle steps are completely optional. The complexity is really in the `discover` and
 * `build` steps (Phase 2) where some basic knowledge of how the TS compiler works is needed,
 * otherwise you're good to go!
 *
 * Take advantage of existing plugins such as `litPlugin` to do the hard work, so you
 * can create your own plugins that focus on the simple stuff.
 */
export interface Plugin<ComponentRootNodeType extends Node = Node> {
  /**
   * The name of the plugin.
   */
  name: string;

  // *** PHASE 1 ***

  /**
   * Optional - Called when initializing the plugin, receives the TypeScript `Program` as an
   * argument.
   */
  init?(program: Program): Promise<void>;

  // *** PHASE 2 ***

  /**
   * Optional - Called to discover any component root nodes inside the given `sourceFile`, these
   * nodes are collected and passed to the `build` function to turn it into a `ComponentMeta`.
   * Discovered nodes are not shared between plugins.
   */
  discover?(sourceFile: SourceFile): Promise<ComponentRootNodeType[]>;
  build?(node: ComponentRootNodeType): Promise<ComponentMeta>;

  /**
   * Optional - Called immediately after ALL plugins complete their `discover` and `build` steps.
   * It's a chance for you to query/add/update/delete any component metadata.
   */
  postbuild?(
    components: ComponentMeta[],
    sourceFiles: SourceFile[],
  ): Promise<ComponentMeta[]>;

  // *** PHASE 3 ***

  /**
   * Optional - Links/merges heritage (mixins/subclasses/interfaces) metadata with its respective
   * component metadata. It's important to note that there's a base `link` process that'll do this
   * out of the box which will run before any plugin `link`.
   */
  link?(
    component: ComponentMeta,
    heritage: HeritageMeta,
  ): Promise<ComponentMeta>;

  /**
   * Optional - Called immediately after ALL plugins complete their `link` step. Similar to
   * `postbuild`, it's a chance for you to query/add/update/delete any component metadata.
   */
  postlink?(
    components: ComponentMeta[],
    sourceFiles: SourceFile[],
  ): Promise<ComponentMeta[]>;

  // *** PHASE 4 ***

  /**
   * Optional - Receives the final component metadata collection and transforms it. This step also
   * receives an `fs` argument that is a collection of filesystem utilties that basically extends
   * the `fs-extra` library with a few Windows friendly path resolver functions.
   */
  transform?(components: ComponentMeta[], fs: PluginFs): Promise<void>;

  // *** PHASE 5 ***

  /**
   * Optional - Called when destroying the plugin.
   */
  destroy?(): Promise<void>;
}
```

### Custom Plugin

Here's an example of a custom plugin that will run [Prettier](https://prettier.io/) on the
markdown files generated by the `markdownPlugin`...

```ts
// wcom.config.ts

import {
  litPlugin,
  MARKDOWN_PLUGIN_DEFAULT_CONFIG,
  markdownPlugin,
  Plugin,
} from '@wcom/cli';
import prettier from 'prettier';

export default [litPlugin(), markdownPlugin(), prettierPlugin()];

/**
 * Formats markdown files generated by the `markdownPlugin` with Prettier.
 */
function prettierPlugin(): Plugin {
  return {
    name: 'prettier',
    async transform(components, fs) {
      await Promise.all(
        components.map(async component => {
          const markdownPath = MARKDOWN_PLUGIN_DEFAULT_CONFIG.outputPath(
            component,
            fs,
          ) as string;

          const markdown = (await fs.readFile(markdownPath)).toString();
          const formattedMarkdown = prettier.format(markdown);
          await fs.writeFile(markdownPath, formattedMarkdown);
        }),
      );
    },
  };
}
```
