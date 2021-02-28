import {
  SourceFile,
  Symbol,
  PropertyDeclaration,
  MethodDeclaration,
  ClassDeclaration,
  Type,
  Decorator,
  Node,
  Signature,
  GetAccessorDeclaration,
} from 'typescript';

export type TypeText = 'any' | 'string' | 'number' | 'boolean' | 'unknown';

export interface TypeReferences {
  [key: string]: TypeReference;
}

export interface TypeReference {
  location: 'local' | 'global' | 'import';
  path?: string;
}

export interface PropTypeInfo {
  original: string;
  resolved: string;
  references: TypeReferences;
}

export interface PropMeta {
  symbol: symbol;
  type: Type;
  declaration: PropertyDeclaration | GetAccessorDeclaration;
  decorator: Decorator;
  typeText: TypeText;
  typeInfo: PropTypeInfo;
  docTags: DocTag[];
  name: string;
  required: boolean;
  readonly: boolean;
  optional: boolean;
  attribute: string;
  reflect: boolean;
  internal: boolean;
  deprecated: boolean;
  defaultValue: string;
  documentation?: string;
  isAccessor: boolean;
  hasSetter?: boolean;
}

export interface MethodTypeInfo {
  signatureText: string;
  returnText: string;
  references: TypeReferences;
}

export interface MethodMeta {
  symbol: symbol;
  declaration: MethodDeclaration;
  name: string;
  typeInfo: MethodTypeInfo;
  signature: Signature;
  returnType: Type;
  internal: boolean;
  deprecated: boolean;
  docTags: DocTag[];
  documentation?: string;
}

export interface EventMeta {
  symbol: symbol;
  declaration: PropertyDeclaration;
  decorator: Decorator;
  type: Type;
  typeInfo: PropTypeInfo;
  name: string;
  bubbles: boolean;
  composed: boolean;
  internal: boolean;
  deprecated: boolean;
  docTags: DocTag[];
  documentation?: string;
}

export interface CssPropMeta {
  name: string;
  description?: string;
  node: Node;
}

export interface CssPartMeta {
  name: string;
  description?: string;
  node: Node;
}

export interface SlotMeta {
  name: string;
  default: boolean;
  description?: string;
  node: Node;
}

export interface DocTag {
  name: string;
  text?: string;
  node: Node;
}

export interface Source {
  file: SourceFile;
  dirPath: string;
  dirName: string;
  fileName: string;
  fileBase: string;
  filePath: string;
  fileExt: string;
}

export interface ComponentMeta {
  tagName: string;
  documentation?: string;
  symbol: symbol;
  declaration: ClassDeclaration;
  source: Source;
  className: string;
  docTags: DocTag[];
  props: PropMeta[];
  methods: MethodMeta[];
  events: EventMeta[];
  cssProps: CssPropMeta[];
  cssParts: CssPartMeta[];
  slots: SlotMeta[];
  dependents: ComponentMeta[];
  dependencies: ComponentMeta[];
}
