import { Observable, filter } from "rxjs";

/**
 * Returns an operator function that filters out null and undefined values from an observable stream.
 *
 * @returns An operator function that filters out null and undefined values.
 * @template T The type of values emitted by the observable.
 */
export function isNonNull<T>(): (source: Observable<T>) => Observable<NonNullable<T>> {
    return function(source: Observable<T>): Observable<NonNullable<T>> {
        return source.pipe(
            filter((value: T): value is NonNullable<T> => value != null && value !== undefined)
        );
    };
}
