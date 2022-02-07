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

import AbRandomVariant from "./ab-random-variant";
import { parse } from "cookie";
import config from "./config";

export default class VariantSelection {
  async select(request) {
    const params = new URL(request.url).searchParams;
    const cookie = parse(request.headers.get("cookie") || "");

    const example = params.get("example");
    if (!example) throw new Error("which ?example=");

    // Fetch AB configuration for the example.
    const cfgResponse = await fetch(config.getAbConfigEndpoint(example));
    if (!cfgResponse) {
      throw new Error(`couldn't find an example that matches.`);
    }

    const testConfig = await cfgResponse.json();
    const origin = testConfig?.control?.url;
    if (!origin) throw new Error("unable to determine origin url.");
    testConfig.name = testConfig.name || example;

    // Determine which variant for this request.
    const test = new AbRandomVariant(testConfig.variants, origin);
    const variantId = +(
      params.get("force") ??
      cookie[testConfig.name] ??
      test.pick()
    );
    const variant = test.getById(variantId);
    if (!variant) throw new Error("unable to pick a variant");

    this.variant = variant;
    this.variantId = variantId;
    this.abName = testConfig.name;
    this.isFreshVisit = cookie[testConfig.name] === undefined;

    return variant;
  }

  makeSelectionSticky(response) {
    if (!this.isFreshVisit) return;
    const name = this.abName;
    const value = this.variantId;
    response.headers.set("set-cookie", `${name}=${value}`);
  }
}
