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

export module ClientAb {

  export type Transform = [
    flag: Flags, selector: string, operation: Operations, ...rest: any
  ]

  export const enum Flags {
    PreUA = 1 << 0,
    OnUA  = 1 << 1,
    Once  = 1 << 2,
  }

  export const enum Operations {
    CustomJs = 0,
    InsertBefore = 1,
    InsertAfter = 2,
    Prepend = 3,
    Append = 4,
    Replace = 5,
    SetInnerHtml = 6,
    Remove = 7,
    SetAttribute = 8,
    Redirect = 9,
  }

}
