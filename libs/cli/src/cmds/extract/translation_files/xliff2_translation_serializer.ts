/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { ɵParsedMessage } from '@angular/localize';
import { ParsedMessageLegacy } from '../../../cmds/common/util';
import { TranslationSerializer } from './translation_serializer';
import { XmlFile } from './xml_file';

export class Xliff2TranslationSerializer implements TranslationSerializer {
  renderFile(
    messages: (ɵParsedMessage | ParsedMessageLegacy)[],
    locale: string,
    isTarget = false
  ): string {
    const xml = new XmlFile();
    xml.startTag('xliff', {
      version: '2.0',
      xmlns: 'urn:oasis:names:tc:xliff:document:2.0',
      srcLang: locale,
      trgLang: locale
    });
    xml.startTag('file');
    messages.forEach(message => {
      xml.startTag('unit', {
        id:
          (message as ɵParsedMessage).id ||
          (message as ParsedMessageLegacy).messageId
      });
      if (message.meaning || message.description) {
        xml.startTag('notes');
        if (message.description) {
          this.renderNote(xml, 'description', message.description);
        }
        if (message.meaning) {
          this.renderNote(xml, 'meaning', message.meaning);
        }
        xml.endTag('notes');
      }
      xml.startTag('segment');
      if (!isTarget) {
        this.generateMessageTag(xml, 'source', message);
      }
      this.generateMessageTag(xml, 'target', message);
      xml.endTag('segment');
      xml.endTag('unit');
    });
    xml.endTag('file');
    xml.endTag('xliff');
    return xml.toString();
  }

  private generateMessageTag(
    xml: XmlFile,
    tagName: string,
    message: ɵParsedMessage | ParsedMessageLegacy
  ) {
    xml.startTag(tagName, {}, { preserveWhitespace: true });
    this.renderMessage(xml, message);
    xml.endTag(tagName, { preserveWhitespace: false });
  }

  private renderMessage(
    xml: XmlFile,
    message: ɵParsedMessage | ParsedMessageLegacy
  ): void {
    xml.text(message.messageParts[0]);
    for (let i = 1; i < message.messageParts.length; i++) {
      const placeholderName = message.placeholderNames[i - 1];
      if (placeholderName.startsWith('START_')) {
        xml.startTag('pc', {
          id: `${i}`,
          equivStart: placeholderName,
          equivEnd: placeholderName.replace(/^START/, 'CLOSE')
        });
      } else if (placeholderName.startsWith('CLOSE_')) {
        xml.endTag('pc');
      } else {
        xml.startTag(
          'ph',
          { id: `${i}`, equiv: placeholderName },
          { selfClosing: true }
        );
      }
      xml.text(message.messageParts[i]);
    }
  }

  private renderNote(xml: XmlFile, name: string, value: string) {
    xml.startTag('note', { category: name }, { preserveWhitespace: true });
    xml.text(value);
    xml.endTag('note', { preserveWhitespace: false });
  }
}
