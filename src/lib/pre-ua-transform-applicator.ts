/**
 * Copyright 2022 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { ClientAb } from './constants';

type FunctionPropertyNames<T> = { [K in keyof T]: T[K] extends Function ? K : never }[keyof T];
type CFElementOperation = [FunctionPropertyNames<Element>, (...args: any[]) => Array<any>];

const clientAbOpToCFOpMap: Partial<Record<ClientAb.Operations, CFElementOperation>> = {
  [ClientAb.Operations.InsertBefore]: ['before', (html) => [html, {html: true}]],
  [ClientAb.Operations.InsertAfter]: ['after', (html) => [html, {html: true}]],
  [ClientAb.Operations.Prepend]: ['prepend', (html) => [html, {html: true}]],
  [ClientAb.Operations.Append]: ['append', (html) => [html, {html: true}]],
  [ClientAb.Operations.Replace]: ['replace', (html) => [html, {html: true}]],
  [ClientAb.Operations.SetInnerHtml]: ['setInnerContent', (html) => [html, {html: true}]],
  [ClientAb.Operations.Remove]: ['remove', () => []],
  [ClientAb.Operations.SetAttribute]: ['setAttribute', (name, value) => [name, value]],
};

export default class PreUATransformApplicator implements HTMLRewriterElementContentHandlers {
  op: ClientAb.Operations;
  args: any[];

  constructor(op: ClientAb.Operations, ...args: any[]) {
    this.op = op;
    this.args = args;
  }

  element(element: Element) {
    if (!this.op) return;

    // If it's a simple operation that translates to a CloudFlare worker method,
    // we can directly execute it.
    const translatedOperation = clientAbOpToCFOpMap[this.op];
    if (translatedOperation) {
      const [method, fnArgTranslator] = translatedOperation;
      // @ts-ignore
      element[method].call(element, ...fnArgTranslator(...this.args));
      return;
    }

    // Handle any complex operations that involves multiple CF operations.
  }
}
