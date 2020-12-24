import { ComponentMeta } from '../../../discover/ComponentMeta';
import { Transformer } from '../../Transformer';
import { ReactTransformerConfig } from './ReactTransformerConfig';

export class ReactTransformer implements Transformer {
  constructor(public config: ReactTransformerConfig) {}

  transform(components: ComponentMeta[]): void {
    // ...
  }
}
