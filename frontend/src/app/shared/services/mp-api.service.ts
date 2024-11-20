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

type MPInput = string;
type MPOutput = string;
type MPLoading = boolean;

@Injectable({
    providedIn: "root",
})
export class MpApiService
    implements ParsePortDataService<MPInput, MPOutput, MPLoading>
{
    public input$ = new Subject<string>();

    public throttledInput$ = this.input$.pipe(
        distinctUntilChanged(),
        throttleTime(300),
    );

    public output$ = this.throttledInput$.pipe(
        switchMap((input) =>
            this.http
                .post<MPOutput | null>(
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
