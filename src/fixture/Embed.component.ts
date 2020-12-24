/* eslint-disable import/no-extraneous-dependencies */
// eslint-disable-next-line max-classes-per-file
import { customElement, LitElement, property } from 'lit-element';
import { Logger } from './Logger';
import { Monkey } from './Monkey';
import './Player.component';

// export class Apples {}

/**
 * Description here. awdawjdkawl
 *
 * @slot This is an unnamed slot (the default slot).
 * @slot body: This is a slot named "start".
 *
 * @cssprop --main-bg-color: Something here.
 * @cssprop --main-u-color: Something here.
 * @csspart container: something
 */
@customElement('vm-embed')
export class Embed extends LitElement {
  /**
   * Long description here.
   *
   * @readonly something
   */
  @property({ attribute: 'apples' })
  apples = '';

  @property({ attribute: 'apples' })
  logger?: Logger;

  /**
   * Random docs.
   *
   * @internal
   * @readonly some mesage her.
   *
   * @param s - Some message.
   * @param s - Some message.
   */
  async randomMethod(s: Monkey): Promise<void> {
    console.log(s);
  }
}
