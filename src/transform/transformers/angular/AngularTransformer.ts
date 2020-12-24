import { ComponentMeta } from '../../../discover/ComponentMeta';
import { Transformer } from '../../Transformer';
import { AngularTransformerConfig } from './AngularTransformerConfig';

export class AngularTransformer implements Transformer {
  constructor(public config: AngularTransformerConfig) {}

  transform(components: ComponentMeta[]): void {
    // ...
  }
}
