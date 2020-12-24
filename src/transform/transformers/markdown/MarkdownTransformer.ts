import { ComponentMeta } from '../../../discover/ComponentMeta';
import { Transformer } from '../../Transformer';
import { MarkdownTransformerConfig } from './MarkdownTransformerConfig';

export class MarkdownTransformer implements Transformer {
  constructor(public config: MarkdownTransformerConfig) {}

  transform(components: ComponentMeta[]): void {
    // ...
  }
}
