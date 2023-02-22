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
    Pre_UA = 1 << 0,
    On_UA  = 1 << 1,
    Once   = 1 << 2,
  }

  export const enum Operations {
    customJs = 0,
    insertBefore = 1,
    insertAfter = 2,
    prepend = 3,
    append = 4,
    replace = 5,
    setInnerHtml = 6,
    remove = 7,
    setAttribute = 8,
    redirect = 9,
  }

}
