
export module ClientAb {

  export type Transform = [
    flag: Flags, selector: string, operation: Operations, ...rest: any
  ]

  export enum Flags {
    Pre_UA = 1 << 0,
    On_UA  = 1 << 1,
  }

  export enum Operations {
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
