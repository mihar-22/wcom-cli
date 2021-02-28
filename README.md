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

## Introduction

This is a lightweight CLI tool that parses your TypeScript files, discovers components and
collects [metadata](./src/discover/ComponentMeta.ts) such as what properties, methods, events and
other information each component contains. This metadata can then be 'transformed' into other formats.

Current transformers include:

- Exports ([example](https://github.com/mihar-22/wcom-lit-test/blob/main/src/components/index.ts))
- JSON ([example](https://github.com/mihar-22/wcom-lit-test/blob/main/components.json))
- Markdown ([example](https://github.com/mihar-22/wcom-lit-test/tree/main/docs))
- VSCode Custom HTML Data ([example](https://github.com/mihar-22/wcom-lit-test/blob/main/vscode.html-data.json))
- HTML + JSX Types ([example](https://github.com/mihar-22/wcom-lit-test/blob/main/src/components.d.ts))

## Caveats

This tool has been designed with the intention of supporting multiple libraries but at this
time it only supports [LitElement](https://lit-element.polymer-project.org).

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

Firstly see this [Button](https://github.com/mihar-22/wcom-lit-test/blob/main/src/components/button/button.component.ts)
as an example of how to document your component.

Next simply run the `transform` command as follows...

```bash
$: wcom transform src/**/*.ts -t json exports markdown
```

For more information call `wcom transform -h` to see what arguments are available.
