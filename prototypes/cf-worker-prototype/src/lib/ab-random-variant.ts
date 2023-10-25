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

import { Experimentation } from "../../../../sdks/npm/lib/index";

export interface Variant {
  weight: number;
  url?: string;
  transformations: Experimentation.Transform[];
}

export class AbRandomVariant {
  _variants: Variant[] = [];
  _totals: number[] = [];

  constructor(variants: Variant[], originUrl: string) {
    this._variants = variants;

    // Weights should add up to 1.
    const remainingWeight = (this._variants || []).reduce(
      (remaining, { weight }) => remaining - weight,
      1
    );
    if (remainingWeight) {
      this._variants.push({ weight: remainingWeight, url: originUrl, transformations: []});
    }

    for (const { weight } of variants) {
      this._totals.push((this._totals[this._totals.length - 1] || 0) + weight);
    }
  }

  getRandom(randomGenerator = Math.random) {
    const target = randomGenerator() * this._totals[this._totals.length - 1];
    let lo = 0;
    let hi = this._totals.length;
    while (lo < hi) {
      const mid = (lo + hi) >>> 1;
      const distance = this._totals[mid];
      if (distance < target) lo = mid + 1;
      else if (distance > target) hi = mid;
      else return mid;
    }
    return lo;
  }

  getById(idx: number) {
    return this._variants[idx];
  }
}