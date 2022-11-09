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

import { ON_UA, OPERATIONS } from "./constants.js";

export default class UATransformApplicator {
  constructor(transforms) {
    this.transforms = transforms;
  }

  static serializeOperation(operation, args) {
    if (operation === OPERATIONS.OP_CUSTOM_JS) {
      return [operation, `$=>{${args[0]}}`];
    }
    return [operation, ...args];
  }

  getSerializedTransforms() {
    const output = [];
    for (const [flags, selector, operation, ...args] of (this.transforms || [])) {
      if (!(flags & ON_UA)) continue;
      output.push([
        "[", flags, ",", JSON.stringify(selector), ",", 
        UATransformApplicator.serializeOperation(operation, args).join(','), 
        "]",
      ].join(""));
    }

    return "[" + output.join(",") + "]";
  }

  generateClientScript() {
    return `<script>(function(k){const l={[0]:(a,b)=>b(a),[1]:(a,b)=>a.insertAdjacentHTML("beforebegin",b),[2]:(a,b)=>a.insertAdjacentHTML("afterend",b),[3]:(a,b)=>a.insertAdjacentHTML("afterbegin",b),[4]:(a,b)=>a.insertAdjacentHTML("beforeend",b),[5]:(a,b)=>a.outerHTML=b,[6]:(a,b)=>a.innerHTML=b,[7]:a=>a.remove(),[8]:(a,b,c)=>a.setAttribute(b,c)},d=new Set;return(new MutationObserver(a=>{for(const {target:b}of a)d.size||requestAnimationFrame(()=>{for(const e of d){d.delete(e);var c=e;if(1===c.nodeType)for(const [m,
      n,f,...p]of k){if(!(m&2)||void 0===f)continue;const g=c.querySelector(n);if(!g)continue;const h=l[f];if(h)try{h(g,...p)}catch(q){}}}}),d.add(b)})).observe(document.documentElement,{childList:!0,subtree:!0})})(${this.getSerializedTransforms()});</script>`;
  }

  element(element) {
    element.append(this.generateClientScript(), { html: true });
  }
}
