import { ComponentMeta } from '../../../discover/ComponentMeta';
import { Transformer } from '../../Transformer';
import { VueTransformerConfig } from './VueTransformerConfig';

export class VueTransformer implements Transformer {
  constructor(public config: VueTransformerConfig) {}

  transform(components: ComponentMeta[]): void {
    // ...
  }
}
