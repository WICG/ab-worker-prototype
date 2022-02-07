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

import { ON_UA } from "./constants.js";

export default class UATransformApplicator {
  constructor(transforms) {
    this.transforms = transforms;
  }

  getSerializedTransforms() {
    const output = [];
    for (const [flags, selector, jsLines] of (this.transforms || [])) {
      if (!(flags & ON_UA)) continue;
      output.push([
        "[", flags, ",", JSON.stringify(selector), ",", 
        `$=>{${jsLines}}`, "]",
      ].join(""));
    }

    return "[" + output.join(",") + "]";
  }

  generateClientScript() {
    return `<script>!function(e){const t=new Set;new MutationObserver(o=>{for(const{target:n}of o)t.size||requestAnimationFrame(()=>{for(const n of t){t.delete(n);var o=n;if(1===o.nodeType)for(const[,[t,n,r]]of e.entries()){if(!(2&t&&r))continue;const e=o.querySelector(n);if(e)try{r(e)}catch(e){}}}}),t.add(n)}).observe(document.documentElement,{childList:!0,subtree:!0})}(${this.getSerializedTransforms()});</script>`;
  }

  element(element) {
    element.append(this.generateClientScript(), { html: true });
  }
}
