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

import {OPERATIONS} from './constants.js';

const opToCloudFlareOpMap = {
  [OPERATIONS.OP_INSERT_BEFORE]: ['before', (html) => [html, {html: true}]],
  [OPERATIONS.OP_INSERT_AFTER]: ['after', (html) => [html, {html: true}]],
  [OPERATIONS.OP_PREPEND]: ['prepend', (html) => [html, {html: true}]],
  [OPERATIONS.OP_APPEND]: ['append', (html) => [html, {html: true}]],
  [OPERATIONS.OP_REPLACE]: ['replace', (html) => [html, {html: true}]],
  [OPERATIONS.OP_SET_INNERHTML]: ['setInnerContent', (html) => [html, {html: true}]],
  [OPERATIONS.OP_REMOVE]: ['remove', () => []],
  [OPERATIONS.OP_SET_ATTRIBUTE]: ['setAttribute', (name, value) => [name, value]],
};

export default class PreUATransformApplicator {
  args = null;

  constructor(op, ...args) {
    this.op = op;
    this.args = args;
  }

  element(element) {
    if (!this.op) return;

    // If it's a simple operation that translates to a CloudFlare worker method,
    // we can directly execute it.
    if (this.op in opToCloudFlareOpMap) {
      const [cfMethod, fnArgTranslator] = opToCloudFlareOpMap[this.op];
      element[cfMethod].call(element, ...fnArgTranslator(...this.args));
      return;
    }

    // Handle any complex operations that involves multiple CF operations.
  }
}
