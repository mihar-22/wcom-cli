import * as fsExtra from 'fs-extra';
import { Node, Program, SourceFile } from 'typescript';

import {
  resolveConfigPaths,
  resolvePath,
  resolveRelativePath,
} from '../utils/resolve';
import { ComponentMeta, HeritageMeta } from './ComponentMeta';

export type PluginFs = typeof fsExtra & {
  resolvePath: typeof resolvePath;
  resolveRelativePath: typeof resolveRelativePath;
  resolveConfigPaths: typeof resolveConfigPaths;
};

export interface Plugin<ComponentRootNodeType extends Node = Node> {
  name: string;
  init?(program: Program): Promise<void>;
  discover?(sourceFile: SourceFile): Promise<ComponentRootNodeType[]>;
  build?(node: ComponentRootNodeType): Promise<ComponentMeta>;
  postbuild?(
    components: ComponentMeta[],
    sourceFiles: SourceFile[],
  ): Promise<ComponentMeta[]>;
  link?(
    component: ComponentMeta,
    heritage: HeritageMeta,
  ): Promise<ComponentMeta>;
  postlink?(
    components: ComponentMeta[],
    sourceFiles: SourceFile[],
  ): Promise<ComponentMeta[]>;
  transform?(components: ComponentMeta[], fs: PluginFs): Promise<void>;
  destroy?(): Promise<void>;
}

export type PluginBuilder<
  ConfigType = unknown,
  ComponentRootNodeType extends Node = Node
> = (config?: ConfigType) => Plugin<ComponentRootNodeType>;
