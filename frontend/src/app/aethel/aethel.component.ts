import { Component, DestroyRef, OnInit } from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { FormControl, FormGroup, Validators } from "@angular/forms";
import { AethelInput, AethelListResult } from "../shared/types";
import { AethelApiService } from "../shared/services/aethel-api.service";
import { Subject, distinctUntilChanged, map } from "rxjs";
import {
    faChevronDown,
    faChevronRight,
} from "@fortawesome/free-solid-svg-icons";
import { ActivatedRoute, Router } from "@angular/router";
import { isNonNull } from "../shared/operators/IsNonNull";
import { StatusService } from "../shared/services/status.service";

@Component({
    selector: "pp-aethel",
    templateUrl: "./aethel.component.html",
    styleUrl: "./aethel.component.scss",
})
export class AethelComponent implements OnInit {
    public form = new FormGroup({
        word: new FormControl<string>("", {
            nonNullable: true,
            validators: [Validators.minLength(3)],
        }),
        limit: new FormControl<number>(10, {
            nonNullable: true,
        }),
        skip: new FormControl<number>(0, {
            nonNullable: true,
        }),
    });
    public rows: AethelListResult[] = [];
    public totalRowCount = 0;
    public loading$ = this.apiService.loading$;
    public submitted = this.apiService.output$.pipe(map(() => true));

    public icons = {
        chevronRight: faChevronRight,
        chevronDown: faChevronDown,
    };

    public status$ = new Subject<boolean>();

    constructor(
        private apiService: AethelApiService,
        private destroyRef: DestroyRef,
        private router: Router,
        private route: ActivatedRoute,
        private statusService: StatusService,
    ) {}

    ngOnInit(): void {
        this.statusService
            .get()
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe((status) => this.status$.next(status.aethel));

        this.apiService.output$
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe((response) => {
                // HTTP error
                if (!response) {
                    return;
                }
                if (response.error) {
                    // TODO: handle error!
                }
                this.rows = this.addUniqueKeys(response.results);
                this.totalRowCount = response.totalCount;
            });

        // Whenever the query parameter changes, we run a new query.
        this.route.queryParams
            .pipe(
                isNonNull(),
                distinctUntilChanged(),
                takeUntilDestroyed(this.destroyRef),
            )
            .subscribe((query) => {
                const word = query["word"] ?? "";
                const type = query["type"];
                const skip = query["skip"] ?? 0;
                const limit = query["limit"] ?? 10;
                this.form.patchValue({ word, skip, limit });
                this.apiService.input$.next({ word, type, skip, limit });
            });
    }

    public combineWord(row: AethelListResult): string {
        return row.phrase.items.map((item) => item.word).join(" ");
    }

    public combineLemma(row: AethelListResult): string {
        return row.phrase.items.map((item) => item.lemma).join(" ");
    }

    public submit(): void {
        this.form.markAllAsTouched();
        this.form.controls.word.updateValueAndValidity();
        const queryInput: AethelInput = this.form.getRawValue();
        this.updateUrl(queryInput);
    }

    private updateUrl(queryInput: AethelInput): void {
        // This does not actually refresh the page because it just adds parameters to the current route.
        // It just updates the URL in the browser, triggering a new query.
        const url = this.router
            .createUrlTree([], {
                relativeTo: this.route,
                queryParams: {
                    ...queryInput,
                },
            })
            .toString();
        this.router.navigateByUrl(url);
    }

    /**
     * Adds unique keys to the items in the array. This is needed for the table to keep track of the data and automatically collapse rows when the data changes.
     */
    private addUniqueKeys(results: AethelListResult[]): AethelListResult[] {
        return results.map((result, index) => {
            const combinedLemma = result.phrase.items
                .map((item) => item.lemma)
                .join(" ");
            const combinedWord = result.phrase.items
                .map((item) => item.word)
                .join(" ");
            return {
                ...result,
                key: `${index}-${combinedLemma}-${combinedWord}-${result.type}`,
            };
        });
    }
}
