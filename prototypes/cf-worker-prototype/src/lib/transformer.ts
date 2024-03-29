
import { ClientAb } from './constants';
import PreUATransformApplicator from './pre-ua-transform-applicator';
import UATransformApplicator from './ua-transform-applicator';

export async function applyTransformations(mutableResponse: Response,
    transformations: ClientAb.Transform[]) {

  // Apply Pre-UA transformations.
  const rewriter = new HTMLRewriter();
  let clientTransformCount = 0;
  for (const [flags, selector, op, ...rest] of transformations) {
    if (flags & ClientAb.Flags.PreUA) {
      rewriter.on(selector, new PreUATransformApplicator(op, ...rest));
    }
    if (flags & ClientAb.Flags.OnUA) clientTransformCount++;
  }

  // If On-UA transforms exist, involve ClientTransformApplicator
  // that serializes all ON_UA transforms + applicator script into
  // HEAD of the document.
  if (clientTransformCount) {
    rewriter.on('head', new UATransformApplicator(transformations));
  }

  return rewriter.transform(mutableResponse);
}