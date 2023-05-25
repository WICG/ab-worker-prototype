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

import {AbRandomVariant, Variant} from './ab-random-variant';
import { parse } from 'cookie';
import config from '../config';

interface AbConfiguration {
  name?: string;
  control: Variant;
  variants: Variant[]
}

export default class VariantSelection {
  variant?: Variant;
  variantId?: number;
  abName?: string;
  isFreshVisit?: boolean;

  async select(request: Request) {
    const params = new URL(request.url).searchParams;
    const cookie = parse(request.headers.get('cookie') || '');

    const experiment = params.get('experiment');
    if (!experiment) throw new Error('which ?experiment=');

    // Fetch AB configuration for the experiment.
    const cfgResponse = await fetch(config.getAbConfigEndpoint(experiment));
    if (!cfgResponse) {
      throw new Error(`couldn't find an experiment that matches.`);
    }

    const testConfig = await cfgResponse.json() as AbConfiguration;
    const origin = testConfig?.control?.url;
    if (!origin) throw new Error('unable to determine origin url.');
    testConfig.name = testConfig.name || experiment;

    // Determine which variant for this request.
    const test = new AbRandomVariant(testConfig.variants, origin);
    const variantId = +(
      params.get('force') ??
      cookie[testConfig.name] ??
      test.getRandom()
    );

    const variant = test.getById(variantId);
    if (!variant) throw new Error('unable to pick a variant');

    this.variant = variant;
    this.variantId = variantId;
    this.abName = testConfig.name;
    this.isFreshVisit = cookie[testConfig.name] === undefined;

    return variant;
  }

  makeSelectionSticky(response: Response) {
    if (!this.isFreshVisit) return;
    const name = this.abName;
    const value = this.variantId;
    response.headers.set('set-cookie', `${name}=${value}`);
  }
}
