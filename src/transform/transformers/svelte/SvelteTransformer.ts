import { ComponentMeta } from '../../../discover/ComponentMeta';
import { Transformer } from '../../Transformer';
import { SvelteTransformerConfig } from './SvelteTransformerConfig';

export class SvelteTransformer implements Transformer {
  constructor(public config: SvelteTransformerConfig) {}

  transform(components: ComponentMeta[]): void {
    // ...
  }
}
