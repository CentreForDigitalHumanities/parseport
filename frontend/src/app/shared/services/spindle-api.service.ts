import { HttpClient, HttpHeaders } from "@angular/common/http";
import { Injectable } from "@angular/core";
import {
    Subject,
    switchMap,
    catchError,
    of,
    distinctUntilChanged,
    throttleTime,
    Observable,
    map,
    merge,
    share,
} from "rxjs";
import { environment } from "src/environments/environment";
import { ErrorHandlerService } from "./error-handler.service";
import { SpindleInput, ExportMode, SpindleReturn } from "../types";
import { ParsePortDataService } from "./ParsePortDataService";

@Injectable({
    providedIn: "root",
})
export class SpindleApiService
    implements
        ParsePortDataService<SpindleInput, SpindleReturn, ExportMode | null>
{
    input$ = new Subject<SpindleInput>();

    throttledInput$ = this.input$.pipe(
        distinctUntilChanged(),
        throttleTime(300),
    );

    output$ = this.throttledInput$.pipe(
        switchMap((input) =>
            this.http
                .post<SpindleReturn | null>(
                    `${environment.apiUrl}spindle/${input.mode}`,
                    { input: input.sentence },
                    {
                        headers: new HttpHeaders({
                            "Content-Type": "application/json",
                        }),
                    },
                )
                .pipe(
                    catchError((error) => {
                        this.errorHandler.handleHttpError(
                            error,
                            $localize`An error occurred while handling your input.`,
                        );
                        // Returning null instead of EMPTY (which completes)
                        // because the outer observable should be notified
                        return of(null);
                    }),
                ),
        ),
        share(),
    );

    loading$: Observable<ExportMode | null> = merge(
        this.throttledInput$.pipe(map((input) => input.mode)),
        this.output$.pipe(map(() => null)),
    );

    constructor(
        private http: HttpClient,
        private errorHandler: ErrorHandlerService,
    ) {}
}
