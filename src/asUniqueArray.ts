// export default function asUniqueArray<A extends ReadonlyArray<any> & AsUniqueArray<A>>(
//   array: A
// ): A {
//   return array;
// }

export default function asUniqueArray<A extends ReadonlyArray<any>>(array: AsUniqueArray<A>): A {
  return array as A;
}
