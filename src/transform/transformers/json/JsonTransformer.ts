import { ComponentMeta } from '../../../discover/ComponentMeta';
import { Transformer } from '../../Transformer';
import { JsonTransformerConfig } from './JsonTransformerConfig';

export class JsonTransformer implements Transformer {
  constructor(public config: JsonTransformerConfig) {}

  transform(components: ComponentMeta[]): void {
    // ...
  }
}
