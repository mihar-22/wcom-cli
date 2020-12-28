import { ClassDeclaration, TypeChecker } from 'typescript';
import {
  ComponentMeta, CssPartMeta, CssPropMeta, DocTag,
  EventMeta, MethodMeta, PropMeta, SlotMeta,
} from './ComponentMeta';

export enum DiscovererId {
  Lit = 'lit',
}

export interface Discoverer {
  CUSTOM_ELEMENT_DECORATOR_NAME: string;
  isComponent(cls: ClassDeclaration): boolean;
  findTagName(cls: ClassDeclaration): string;
  findProps(checker: TypeChecker, cls: ClassDeclaration): PropMeta[];
  findMethods(checker: TypeChecker, cls: ClassDeclaration): MethodMeta[];
  findEvents(checker: TypeChecker, cls: ClassDeclaration): EventMeta[];
  findDocTags(cls: ClassDeclaration): DocTag[];
  findCssProps(docTags: DocTag[]): CssPropMeta[];
  findCssParts(docTags: DocTag[]): CssPartMeta[];
  findSlots(docTags: DocTag[]): SlotMeta[];
  buildDependencyMap(components: ComponentMeta[]): void;
}
