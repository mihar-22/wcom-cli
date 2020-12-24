import { ComponentMeta } from '../../../discover/ComponentMeta';
import { Transformer } from '../../Transformer';
import { VsCodeTransformerConfig } from './VsCodeTransformerConfig';

export class VsCodeTransformer implements Transformer {
  constructor(public config: VsCodeTransformerConfig) {}

  transform(components: ComponentMeta[]): void {
    // ...
  }
}
