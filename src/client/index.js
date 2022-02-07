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

import { ON_UA, PRE_UA } from "../constants.js";

(function applyTransformations(transformations) {
  const transform = (target) => {
    if (target.nodeType !== 1) return;
    for (const [i, [flags, selector, transform]] of transformations.entries()) {
      if (!(flags & ON_UA) || !transform) continue;

      const node = target.querySelector(selector);
      if (!node) continue;

      try {
        transform(node);
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
