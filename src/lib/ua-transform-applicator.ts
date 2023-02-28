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

export default class UATransformApplicator  implements HTMLRewriterElementContentHandlers {
  transforms: ClientAb.Transform[];

  constructor(transforms: ClientAb.Transform[]) {
    this.transforms = transforms;
  }

  static serializeOperation(operation: ClientAb.Operations, args: any[]) {
    if (operation === ClientAb.Operations.CustomJs) {
      return [operation, `$=>{${args[0]}}`];
    }
    return [operation, ...args.map(arg => JSON.stringify(arg))];
  }

  getSerializedTransforms() {
    const output = [];
    for (const [flags, selector, operation, ...args] of (this.transforms || [])) {
      if (!(flags & ClientAb.Flags.OnUA)) continue;
      output.push([
        '[', flags, ',', JSON.stringify(selector), ',',
        UATransformApplicator.serializeOperation(operation, args).join(','),
        ']',
      ].join(''));
    }

    return '[' + output.join(',') + ']';
  }

  generateClientScript() {
    // CloudFlare doesn't allow file reads, so this is generated via
    // npx pack-client and embedded here manually.
    return `<script>(function(k){const l={[0]:(a,b)=>b(a),[1]:(a,b)=>a.insertAdjacentHTML("beforebegin",b),[2]:(a,b)=>a.insertAdjacentHTML("afterend",b),[3]:(a,b)=>a.insertAdjacentHTML("afterbegin",b),[4]:(a,b)=>a.insertAdjacentHTML("beforeend",b),[5]:(a,b)=>a.outerHTML=b,[6]:(a,b)=>a.innerHTML=b,[7]:a=>a.remove(),[8]:(a,b,c)=>a.setAttribute(b,c)},d=new Set;return(new MutationObserver(a=>{for(const {target:b}of a)b.nodeType===Node.ELEMENT_NODE&&(a=b,d.size||requestAnimationFrame(()=>{for(const e of d){d.delete(e);var c=
      e;if(1===c.nodeType)for(const [m,n,f,...p]of k){if(!(m&2)||void 0===f)continue;const g=c.querySelector(n);if(!g)continue;const h=l[f];if(h)try{h(g,...p)}catch(q){}}}}),d.add(a))})).observe(document.documentElement,{childList:!0,subtree:!0})})(${this.getSerializedTransforms()});</script>`;
  }

  element(element: Element) {
    element.append(this.generateClientScript(), { html: true });
  }
}
