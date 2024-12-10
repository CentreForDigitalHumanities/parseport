import { Injectable } from "@angular/core";
import { ParsePortDataService } from "./ParsePortDataService";
import {
    catchError,
    distinctUntilChanged,
    map,
    merge,
    of,
    share,
    Subject,
    switchMap,
    throttleTime,
} from "rxjs";
import { HttpClient, HttpHeaders } from "@angular/common/http";
import { environment } from "src/environments/environment";
import { ErrorHandlerService } from "./error-handler.service";
import { MGParserInput, MGParserLoading, MGParserOutput } from "../types";


@Injectable({
    providedIn: "root",
})
export class MGParserAPIService
    implements
        ParsePortDataService<MGParserInput, MGParserOutput, MGParserLoading>
{
    public input$ = new Subject<string>();

    public throttledInput$ = this.input$.pipe(
        distinctUntilChanged(),
        throttleTime(300),
    );

    public output$ = this.throttledInput$.pipe(
        switchMap((input) =>
            this.http
                .post<MGParserOutput | null>(
                    `${environment.apiUrl}mp/parse`,
                    { input },
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

    public loading$ = merge(
        this.throttledInput$.pipe(map(() => true)),
        this.output$.pipe(map(() => false)),
    );

    constructor(
        private http: HttpClient,
        private errorHandler: ErrorHandlerService,
    ) {}
}
