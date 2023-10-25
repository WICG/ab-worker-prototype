import { ClientAb } from './constants';

type FunctionPropertyNames<T> = { [K in keyof T]: T[K] extends Function ? K : never }[keyof T];
type CFElementOperation = [FunctionPropertyNames<Element>, (...args: any[]) => Array<any>];

const clientAbOpToCFOpMap: Partial<Record<ClientAb.Operations, CFElementOperation>> = {
  [ClientAb.Operations.insertBefore]: ['before', (html) => [html, {html: true}]],
  [ClientAb.Operations.insertAfter]: ['after', (html) => [html, {html: true}]],
  [ClientAb.Operations.prepend]: ['prepend', (html) => [html, {html: true}]],
  [ClientAb.Operations.append]: ['append', (html) => [html, {html: true}]],
  [ClientAb.Operations.replace]: ['replace', (html) => [html, {html: true}]],
  [ClientAb.Operations.setInnerHtml]: ['setInnerContent', (html) => [html, {html: true}]],
  [ClientAb.Operations.remove]: ['remove', () => []],
  [ClientAb.Operations.setAttribute]: ['setAttribute', (name, value) => [name, value]],
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
