export type Copy<A extends object> = { [P in keyof A]: A[P] };

export type DiffKeys<A extends object, B extends object> = Exclude<keyof A, keyof B>;

export type Diff<A extends object, B extends object> = Pick<A, DiffKeys<A, B>>;

export type IntersectionKeys<A extends object, B extends object> = Extract<keyof A, keyof B>;

export type Intersection<A extends object, B extends object> = Pick<A, IntersectionKeys<A, B>>;

export type Merge<A extends object, B extends object> = Diff<A, B> & B;

// export type Omit<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>;
// export type Omit<
//   A extends object,
//   K extends Extract<K, K> extends keyof A
//     ? keyof A
//     : (Extract<keyof A, keyof K> extends never ? never : object)
// > = Pick<A, Exclude<keyof A, K extends keyof A ? K : keyof K>>;
export type Omit<
  A extends object,
  K extends
    | keyof A
    | (Extract<keyof A, keyof K> extends never ? never : Pick<K, Extract<keyof A, keyof K>>)
> = Pick<A, Exclude<keyof A, K extends keyof A ? K : keyof K>>;

export type Overwrite<
  A extends object | B,
  B extends IntersectionKeys<B, A> extends never ? never : Intersection<B, A>
> = { [P in keyof Merge<A, B>]: Merge<A, B>[P] };

/** Return keys of type `T` */
export type KeysOfType<A extends object, B> = {
  [P in keyof A]: A[P] extends B ? P : never
}[keyof A];

export type ExcludeKeysOfType<A extends object, B> = Pick<A, Exclude<keyof A, KeysOfType<A, B>>>;

export type ExtractKeysOfType<A extends object, B> = Pick<A, KeysOfType<A, B>>;
