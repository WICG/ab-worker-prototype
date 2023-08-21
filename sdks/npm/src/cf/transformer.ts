import { Experimentation } from '../index';
import PreUATransformApplicator from './pre-ua-applicator';
import UATransformApplicator from './on-ua-applicator';

const supportedOperations = new Set(Object.values(Experimentation.Operations));

export async function applyTransformations(mutableResponse: Response,
    transformations: Experimentation.Transform[]) {

  // Apply Pre-UA transformations.
  const rewriter = new HTMLRewriter();
  let clientTransformCount = 0;
  for (const [flags, selector, op, ...rest] of transformations) {
    if (!supportedOperations.has(op)) continue;
    if (flags & Experimentation.Flags.PreUA) {
      rewriter.on(selector, new PreUATransformApplicator(op, ...rest));
    }
    if (flags & Experimentation.Flags.OnUA) clientTransformCount++;
  }

  // If On-UA transforms exist, involve ClientTransformApplicator
  // that serializes all ON_UA transforms + applicator script into
  // HEAD of the document.
  if (clientTransformCount) {
    rewriter.on('head', new UATransformApplicator(transformations));
  }

  return rewriter.transform(mutableResponse);
}