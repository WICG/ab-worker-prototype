import { Experimentation } from '../index';

type FunctionPropertyNames<T> = { [K in keyof T]: T[K] extends Function ? K : never }[keyof T];
type CFElementOperation = [FunctionPropertyNames<Element>, (...args: any[]) => Array<any>];

const experimentationOpToCFOpMap: Partial<Record<Experimentation.Operations, CFElementOperation>> = {
  [Experimentation.Operations.InsertBefore]: ['before', (html) => [html, {html: true}]],
  [Experimentation.Operations.InsertAfter]: ['after', (html) => [html, {html: true}]],
  [Experimentation.Operations.Prepend]: ['prepend', (html) => [html, {html: true}]],
  [Experimentation.Operations.Append]: ['append', (html) => [html, {html: true}]],
  [Experimentation.Operations.Replace]: ['replace', (html) => [html, {html: true}]],
  [Experimentation.Operations.SetInnerHtml]: ['setInnerContent', (html) => [html, {html: true}]],
  [Experimentation.Operations.Remove]: ['remove', () => []],
  [Experimentation.Operations.SetAttribute]: ['setAttribute', (name, value) => [name, value]],
};

export default class PreUATransformApplicator implements HTMLRewriterElementContentHandlers {
  op: Experimentation.Operations;
  args: any[];

  constructor(op: Experimentation.Operations, ...args: any[]) {
    this.op = op;
    this.args = args;
  }

  element(element: Element) {
    if (!this.op) return;

    // If it's a simple operation that translates to a CloudFlare worker method,
    // we can directly execute it.
    const translatedOperation = experimentationOpToCFOpMap[this.op];
    if (translatedOperation) {
      const [method, fnArgTranslator] = translatedOperation;
      // @ts-ignore
      element[method].call(element, ...fnArgTranslator(...this.args));
      return;
    }

    // Handle any complex operations that involves multiple CF operations.
    switch (this.op) {
      case Experimentation.Operations.Redirect:
        const [url, code] = this.args;
        Response.redirect(url, code);
        break;
    }
  }
}