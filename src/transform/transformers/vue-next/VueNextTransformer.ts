import { ComponentMeta } from '../../../discover/ComponentMeta';
import { Transformer } from '../../Transformer';
import { VueNextTransformerConfig } from './VueNextTransformerConfig';

export class VueNextTransformer implements Transformer {
  constructor(public config: VueNextTransformerConfig) {}

  transform(components: ComponentMeta[]): void {
    // ...
  }
}
