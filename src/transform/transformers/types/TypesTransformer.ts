import { ComponentMeta } from '../../../discover/ComponentMeta';
import { Transformer } from '../../Transformer';
import { TypesTransformerConfig } from './TypesTransformerConfig';

export class TypesTransformer implements Transformer {
  constructor(public config: TypesTransformerConfig) {}

  transform(components: ComponentMeta[]): void {
    // ...
  }
}
