/* eslint-disable no-use-before-define */
/* eslint-disable max-classes-per-file */
import NoSuchElementError from '../NoSuchElementError';
import { Option, None } from './Option';

export type Throwable = Error | AnyObject;
export type Success<A> = Try<A>;
export type Failure = Try<never>;

export abstract class Try<A> {
  /**
   * Evaluates the given `thunk` and returns either a [[Success]],
   * in case the evaluation succeeded, or a [[Failure]], in case
   * an exception was thrown.
   *
   * Example:
   *
   * ```typescript
   * let effect = 0
   *
   * const e = Try.of(() => { effect += 1; return effect })
   * e.get() // 1
   * ```
   */
  static of<T>(thunk: () => T): Try<T> {
    try {
      return Success(thunk());
    } catch (e) {
      return Failure(e as Throwable);
    }
  }

  /**
   * Returns a [[Try]] reference that represents a successful result
   * (i.e. wrapped in [[Success]]).
   */
  static success<T>(value: T): Try<T> {
    return Success(value);
  }

  /**
   * Returns a [[Try]] reference that represents a failure
   * (i.e. an exception wrapped in [[Failure]]).
   */
  static failure<T = never>(error: Throwable): Try<T> {
    return Failure(error);
  }

  private readonly isSuccessTag: boolean;

  private readonly value: A | Throwable;

  protected constructor(value: A | Throwable, tag: 'failure' | 'success') {
    this.isSuccessTag = tag === 'success';
    this.value = value;
  }

  /**
   * Returns `true` if the source is a [[Success]] result,
   * or `false` in case it is a [[Failure]].
   */
  isSuccess(): this is Success<A> {
    return this.isSuccessTag;
  }

  /**
   * Returns `true` if the source is a [[Failure]],
   * or `false` in case it is a [[Success]] result.
   */
  isFailure(): this is Failure {
    return !this.isSuccess();
  }

  /**
   * Returns a Try's successful value if it's a [[Success]] reference,
   * otherwise throws an exception if it's a [[Failure]].
   *
   * WARNING!
   *
   * This function is partial, the option must be non-empty, otherwise
   * a runtime exception will get thrown. Use with care.
   */
  get(): A {
    if (this.isFailure()) throw (this as Failure).value;
    return this.value as A;
  }

  /**
   * Returns the value from a `Success` or the given `fallback`
   * value if this is a `Failure`.
   *
   * ```typescript
   * Success(10).getOrElse(27) // 10
   * Failure("error").getOrElse(27)  // 27
   * ```
   */
  getOrElse<AA>(fallback: AA): A | AA {
    return this.isSuccess() ? (this.value as A) : fallback;
  }

  /**
   * Returns the value from a `Success` or the value generated
   * by a given `thunk` in case this is a `Failure`.
   *
   * ```typescript
   * Success(10).getOrElseL(() => 27) // 10
   * Failure("error").getOrElseL(() => 27)  // 27
   * ```
   */
  getOrElseL<AA>(thunk: () => AA): A | AA {
    return this.isSuccess() ? (this.value as A) : thunk();
  }

  /**
   * Returns the current value if it's a [[Success]], or
   * if the source is a [[Failure]] then return `null`.
   *
   * ```typescript
   * Success(10).orNull()      // 10
   * Failure("error").orNull() // null
   * ```
   *
   * This can be useful for use-cases such as:
   *
   * ```typescript
   * Try.of(() => dict.user.profile.name).orNull()
   * ```
   */
  orNull(): A | null {
    return this.isSuccess() ? (this.value as A) : null;
  }

  /**
   * Returns the current value if it's a [[Success]], or
   * if the source is a [[Failure]] then return `undefined`.
   *
   * ```typescript
   * Success(10).orUndefined()      // 10
   * Failure("error").orUndefined() // undefined
   * ```
   *
   * This can be useful for use-cases such as:
   *
   * ```typescript
   * Try.of(() => dict.user.profile.name).orUndefined()
   * ```
   */
  orUndefined(): A | undefined {
    return this.isSuccess() ? (this.value as A) : undefined;
  }

  /**
   * Returns the current value if it's a [[Success]], or if
   * the source is a [[Failure]] then return the `fallback`.
   *
   * ```typescript
   * Success(10).orElse(Success(17))      // 10
   * Failure("error").orElse(Success(17)) // 17
   * ```
   */
  orElse<AA>(fallback: Try<AA>): Try<A | AA> {
    if (this.isSuccess()) return this;
    return fallback;
  }

  /**
   * Returns the current value if it's a [[Success]], or if the source
   * is a [[Failure]] then return the value generated by the given
   * `thunk`.
   *
   * ```typescript
   * Success(10).orElseL(() => Success(17))      // 10
   * Failure("error").orElseL(() => Success(17)) // 17
   * ```
   */
  orElseL<AA>(thunk: () => Try<AA>): Try<A | AA> {
    if (this.isSuccess()) return this;
    return thunk();
  }

  // /**
  //  * Inverts this `Try`. If this is a [[Failure]], returns its exception wrapped
  //  * in a [[Success]]. If this is a `Success`, returns a `Failure` containing a
  //  * [[NoSuchElementError]].
  //  */
  // failed(): Try<Throwable> {
  //   return this.isSuccess()
  //     ? Failure(new NoSuchElementError('try.failed()'))
  //     : Success(this.value as Throwable);
  // }

  /**
   * Applies the `failure` function to [[Failure]] values, and the
   * `success` function to [[Success]] values and returns the result.
   *
   * ```typescript
   * const maybeNum: Try<number> =
   *   tryParseInt("not a number")
   *
   * const result: string =
   *   maybeNum.fold(
   *     error => `Could not parse string: ${error}`,
   *     num => `Success: ${num}`
   *   )
   * ```
   */
  fold<R>(failure: (error: Throwable) => R, success: (a: A) => R): R {
    return this.isSuccess() ? success(this.value as A) : failure((this as Failure).value);
  }

  /**
   * Returns a [[Failure]] if the source is a [[Success]], but the
   * given `p` predicate is not satisfied.
   *
   * @throws NoSuchElementError in case the predicate doesn't hold
   */
  filter<B extends A>(p: (a: A) => a is B): Try<B>;

  filter(p: (a: A) => boolean): Try<A>;

  filter(p: (a: A) => boolean): Try<A> {
    if (this.isFailure()) return this;
    try {
      if (p(this.value as A)) return this;
      return Failure(new NoSuchElementError(`Predicate does not hold for ${String(this.value)}`));
    } catch (e) {
      return Failure(e as Throwable);
    }
  }

  /**
   * Returns the given function applied to the value if this is
   * a [[Success]] or returns `this` if this is a [[Failure]].
   *
   * This operation is the monadic "bind" operation.
   * It can be used to *chain* multiple `Try` references.
   *
   * ```typescript
   * Try.of(() => parse(s1)).flatMap(num1 =>
   *   Try.of(() => parse(s2)).map(num2 =>
   *     num1 / num2
   *   ))
   * ```
   */
  flatMap<B>(f: (a: A) => Try<B>): Try<B> {
    if (this.isFailure()) return this;
    try {
      return f(this.value as A);
    } catch (e) {
      return Failure(e as Throwable);
    }
  }

  /**
   * Returns a `Try` containing the result of applying `f` to
   * this option's value, but only if it's a `Success`, or
   * returns the current `Failure` without any modifications.
   *
   * NOTE: this is similar with `flatMap`, except with `map` the
   * result of `f` doesn't need to be wrapped in a `Try`.
   *
   * @param f the mapping function that will transform the value
   *          of this `Try` if successful.
   *
   * @return a new `Try` instance containing the value of the
   *         source mapped by the given function
   */
  map<B>(f: (a: A) => B): Try<B> {
    return this.isSuccess() ? Try.of(() => f(this.value as A)) : this;
  }

  /**
   * Applies the given function `cb` if this is a [[Success]], otherwise
   * returns `void` if this is a [[Failure]].
   */
  forEach(cb: (a: A) => void): void {
    if (this.isSuccess()) cb(this.value as A);
  }

  /**
   * Applies the given function `f` if this is a `Failure`, otherwise
   * returns `this` if this is a `Success`.
   *
   * This is like `map` for the exception.
   *
   * In the following example, if the `user.profile.email` exists,
   * then it is returned as a successful value, otherwise
   *
   * ```typescript
   * Try.of(() => user.profile.email).recover(e => {
   *   // Access error? Default to empty.
   *   if (e instanceof TypeError) return ""
   *   throw e // We don't know what it is, rethrow
   * })
   *
   * Note that on rethrow, the error is being caught in `recover` and
   * it still returns it as a `Failure(e)`.
   * ```
   */
  recover<AA>(f: (error: Throwable) => AA): Try<A | AA> {
    return this.isSuccess() ? this : Try.of(() => f(this.value as Throwable));
  }

  /**
   * Applies the given function `f` if this is a `Failure`, otherwise
   * returns `this` if this is a `Success`.
   *
   * This is like `map` for the exception.
   *
   * In the following example, if the `user.profile.email` exists,
   * then it is returned as a successful value, otherwise
   *
   * ```typescript
   * Try.of(() => user.profile.email).recover(e => {
   *   // Access error? Default to empty.
   *   if (e instanceof TypeError) return ""
   *   throw e // We don't know what it is, rethrow
   * })
   *
   * Note that on rethrow, the error is being caught in `recover` and
   * it still returns it as a `Failure(e)`.
   * ```
   */
  recoverWith<AA>(f: (error: Throwable) => Try<AA>): Try<A | AA> {
    try {
      return this.isSuccess() ? this : f((this as Failure).value);
    } catch (e) {
      return Failure(e as Throwable);
    }
  }

  /**
   * Transforms the source into an [[Option]].
   *
   * In case the source is a `Success(v)`, then it gets translated
   * into a `Some(v)`. If the source is a `Failure(e)`, then a `None`
   * value is returned.
   *
   * ```typescript
   * Success("value").toOption() // Some("value")
   * Failure("error").toOption() // None
   * ```
   */
  toOption(): Option<A> {
    return this.isSuccess() ? Option.of(this.value as A) : None;
  }

  equals(that: Try<A>): boolean {
    if (that == null) return false;
    return this.isSuccess()
      ? that.isSuccess() && this.value === that.value
      : that.isFailure() && (this as Failure).value === that.value;
  }
}

/**
 * The `Success` data constructor is for building [[Try]] values that
 * are successful results of computations, as opposed to [[Failure]].
 */
export function Success<A>(value: A): Try<A> {
  return new (class extends Try<A> {
    constructor() {
      super(value, 'success');
    }
  })();
}

/**
 * The `Failure` data constructor is for building [[Try]] values that
 * represent failures, as opposed to [[Success]].
 */
export function Failure<A = never>(error: Throwable): Try<A> {
  return new (class extends Try<never> {
    constructor() {
      super(error, 'failure');
    }
  })();
}
