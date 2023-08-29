export module Experimentation {
  export type Transform = [
    flag: Flags, selector: string, operation: Operations, ...rest: any
  ]

  export enum Flags {
    PreUA = 1 << 0,
    OnUA  = 1 << 1,
    Once  = 1 << 2,
  }

  export enum Operations {
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
