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

import VariantSelection from './lib/ab-variant-selection';
import packageJson from '../package.json';
import { applyTransformations } from '../../../sdks/npm/lib/cf/transformer';

const identificationString = `${packageJson.name}/${packageJson.version}`;

export interface Env {}

export default {
	async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    // In this prototype, since we are dealing with arbitrary origins, this call is
    // made blocking (since it needs to fetch config to identify the origin).
    // In a real world implementation, this call could be federated parallel to
    // the fetch of origin endpoint, minimizing/avoiding latency for an Ab config fetch.
    const ab = new VariantSelection();
    let variant;
    try {
      variant = await ab.select(request);
    } catch (e: any) {
      return new Response(e.message);
    }

    if (!variant.url) return new Response('cannot find origin');

    // Fetch origin (or the url specified by variant)
    const controlResponse = await fetch(variant.url, {
      headers: {
        'content-type': 'text/html;charset=utf-8',
        'user-agent': `Mozilla/5.0 (Macintosh; Intel Mac OS X 13_2_1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36 ${identificationString}`,
      },
    });

    const mutableResponse = new Response(controlResponse.body, controlResponse);
    ab.makeSelectionSticky(mutableResponse);
    return applyTransformations(mutableResponse, variant.transformations);
  },
};
