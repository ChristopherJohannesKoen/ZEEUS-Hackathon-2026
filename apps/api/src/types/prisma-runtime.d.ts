declare module '@prisma/client/runtime/library.js' {
  export type ITXClientDenyList =
    | '$connect'
    | '$disconnect'
    | '$on'
    | '$transaction'
    | '$use'
    | '$extends';
}
