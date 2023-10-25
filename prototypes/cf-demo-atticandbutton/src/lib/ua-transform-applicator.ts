import { ClientAb } from './constants';

export default class UATransformApplicator  implements HTMLRewriterElementContentHandlers {
  transforms: ClientAb.Transform[];

  constructor(transforms: ClientAb.Transform[]) {
    this.transforms = transforms;
  }

  static serializeOperation(operation: ClientAb.Operations, args: any[]) {
    if (operation === ClientAb.Operations.customJs) {
      return [operation, `$=>{${args[0]}}`];
    }
    return [operation, ...args.map(arg => JSON.stringify(arg))];
  }

  getSerializedTransforms() {
    const output = [];
    for (const [flags, selector, operation, ...args] of (this.transforms || [])) {
      if (!(flags & ClientAb.Flags.On_UA)) continue;
      output.push([
        '[', flags, ',', JSON.stringify(selector), ',',
        UATransformApplicator.serializeOperation(operation, args).join(','),
        ']',
      ].join(''));
    }

    return '[' + output.join(',') + ']';
  }

  generateClientScript() {
    return `<script>(function(k){const l={[0]:(a,b)=>b(a),[1]:(a,b)=>a.insertAdjacentHTML("beforebegin",b),[2]:(a,b)=>a.insertAdjacentHTML("afterend",b),[3]:(a,b)=>a.insertAdjacentHTML("afterbegin",b),[4]:(a,b)=>a.insertAdjacentHTML("beforeend",b),[5]:(a,b)=>a.outerHTML=b,[6]:(a,b)=>a.innerHTML=b,[7]:a=>a.remove(),[8]:(a,b,c)=>a.setAttribute(b,c)},d=new Set;return(new MutationObserver(a=>{for(const {target:b}of a)d.size||requestAnimationFrame(()=>{for(const e of d){d.delete(e);var c=e;if(1===c.nodeType)for(const [m,
      n,f,...p]of k){if(!(m&2)||void 0===f)continue;const g=c.querySelector(n);if(!g)continue;const h=l[f];if(h)try{h(g,...p)}catch(q){}}}}),d.add(b)})).observe(document.documentElement,{childList:!0,subtree:!0})})(${this.getSerializedTransforms()});</script>`;
  }

  element(element: Element) {
    element.append(this.generateClientScript(), { html: true });
  }
}
