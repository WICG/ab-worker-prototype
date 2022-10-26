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

import { ON_UA, PRE_UA, OPERATIONS } from "../constants.js";

(function applyTransformations(transformations) {
  const applicators = {
    [OPERATIONS.OP_CUSTOM_JS]: (node, transform) => transform(node),
    [OPERATIONS.OP_INSERT_BEFORE]: (node, html) => node.insertAdjacentHTML('beforebegin', html),
    [OPERATIONS.OP_INSERT_AFTER]: (node, html) => node.insertAdjacentHTML('afterend', html),
    [OPERATIONS.OP_PREPEND]: (node, html) => node.insertAdjacentHTML('afterbegin', html),
    [OPERATIONS.OP_APPEND]: (node, html) => node.insertAdjacentHTML('beforeend', html),
    [OPERATIONS.OP_REPLACE]: (node, html) => node.outerHTML = html,
    [OPERATIONS.OP_SET_INNERHTML]: (node, html) => node.innerHTML = html,
    [OPERATIONS.OP_REMOVE]: (node) => node.remove(),
    [OPERATIONS.OP_SET_ATTRIBUTE]: (node, name, value) => node.setAttribute(name, value),
  };
  
  const transform = (target) => {
    if (target.nodeType !== 1) return;
    for (const [flags, selector, operation, ...args] of transformations) {
      if (!(flags & ON_UA) || operation === undefined) continue;

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

  const queue = new Set();
  var observer = new MutationObserver((mutations) => {
    for (const { target } of mutations) {
      if (!queue.size) {
        requestAnimationFrame(() => {
          for (const target of queue) {
            queue.delete(target);
            transform(target);
          }
        });
      }
      queue.add(target);
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
