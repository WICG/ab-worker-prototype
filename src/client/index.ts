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

import { ClientAb } from '../lib/constants.js';

type AnyDOMOperation = (...args: any[]) => Array<any>;

(function applyTransformations(transformations: ClientAb.Transform[]) {
  const applicators: Partial<Record<ClientAb.Operations, AnyDOMOperation>> = {
    [ClientAb.Operations.CustomJs]: (node, transform) => transform(node),
    [ClientAb.Operations.InsertBefore]: (node, html) => node.insertAdjacentHTML('beforebegin', html),
    [ClientAb.Operations.InsertAfter]: (node, html) => node.insertAdjacentHTML('afterend', html),
    [ClientAb.Operations.Prepend]: (node, html) => node.insertAdjacentHTML('afterbegin', html),
    [ClientAb.Operations.Append]: (node, html) => node.insertAdjacentHTML('beforeend', html),
    [ClientAb.Operations.Replace]: (node, html) => node.outerHTML = html,
    [ClientAb.Operations.SetInnerHtml]: (node, html) => node.innerHTML = html,
    [ClientAb.Operations.Remove]: (node) => node.remove(),
    [ClientAb.Operations.SetAttribute]: (node, name, value) => node.setAttribute(name, value),
  };

  const transform = (target: HTMLElement) => {
    if (target.nodeType !== 1) return;
    for (const [flags, selector, operation, ...args] of transformations) {
      if (!(flags & ClientAb.Flags.OnUA) || operation === undefined) continue;

      const element = target.querySelector(selector);
      if (!element) continue;

      const applicator = applicators[operation];
      if (!applicator) continue; // report back unsupported applicator usage.

      try {
        applicator(element, ...args);
      } catch (e) {
        /* report back transform error */
      }
    }
  };

  const queue = new Set<HTMLElement>();
  var observer = new MutationObserver((mutations) => {
    for (const { target } of mutations) {
      if (target.nodeType !== Node.ELEMENT_NODE) continue;
      const mutatedElement = target as HTMLElement;
      if (!queue.size) {
        requestAnimationFrame(() => {
          for (const el of queue) {
            queue.delete(el);
            transform(el);
          }
        });
      }
      queue.add(mutatedElement);
    }
  });

  // We are only blocking execution in HEAD of the document to
  // hook the observer. Rest is all async and on-paint.
  return observer.observe(document.documentElement, {
    childList: true,
    subtree: true,
  });
})([
  /* Array of transformations */
]);
