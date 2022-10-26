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

import { ON_UA, PRE_UA, OPERATIONS} from "./constants";
import VariantSelection from "./ab-variant-selection";
import PreUATransformApplicator from "./pre-ua-transform-applicator";
import UATransformApplicator from "./ua-transform-applicator";
const error = (message) => new Response(message);

const SUPPORTED_OPERATIONS = new Set(Object.values(OPERATIONS));

export default {
  async fetch(request, environment, context) {
    // In this prototype, since we are dealing with arbitrary origins,
    // this call is made blocking (since it needs to fetch config to
    // identify the origin). In a real scenario, this call could be federated
    // parallel to the fetch of origin endpoint, reducing/avoiding latency.
    const ab = new VariantSelection();
    let variant;
    try {
      variant = await ab.select(request);
    } catch (e) {
      return error(e.message);
    }

    // Fetch origin (or the url specified by variant)
    const response = await fetch(variant.url, variant.cache);

    // Apply Pre-UA transformations.
    const rewriter = new HTMLRewriter();
    let clientTransformCount = 0;
    const transformations = variant.transformations || [];
    for (const [flags, selector, op, ...rest] of transformations) {
      if (!SUPPORTED_OPERATIONS.has(op)) {
        // TODO: Report to telemetry on unsupported opcode. In this demo, 
        // we're just going to skip ahead. In reality, a broken transform might make the 
        // subsequent opcodes incompatible if they're sequential and dependent.
        continue;
      }
      if (flags & PRE_UA) {
        rewriter.on(selector, new PreUATransformApplicator(op, ...rest));
      }
      if (flags & ON_UA) clientTransformCount++;
    }

    // If On-UA transforms exist, involve ClientTransformApplicator
    // that serializes all ON_UA transforms + applicator script into 
    // HEAD of the document.
    if (clientTransformCount) {
      rewriter.on("head", new UATransformApplicator(transformations));
    }

    const mutableResponse = new Response(response.body, response);
    ab.makeSelectionSticky(mutableResponse);
    return rewriter.transform(mutableResponse);
  },
};
