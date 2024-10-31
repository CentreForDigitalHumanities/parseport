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
import { TablePageEvent } from "primeng/table";

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
        type: new FormControl<string>("", {
            nonNullable: true,
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
                const skip = query["skip"] ? parseInt(query["skip"], 10) : 0;
                const limit = query["limit"]
                    ? parseInt(query["limit"], 10)
                    : 10;

                this.form.patchValue({ word, type, skip, limit });
                this.apiService.input$.next({ word, type, skip, limit });
            });
    }

    public changePage(page: TablePageEvent): void {
        if (
            page.first === this.form.controls.skip.value &&
            page.rows === this.form.controls.limit.value
        ) {
            return;
        }
        this.form.patchValue({
            skip: page.first,
            limit: page.rows,
        });
        this.prepareQuery();
    }

    public combineWord(row: AethelListResult): string {
        return row.phrase.items.map((item) => item.word).join(" ");
    }

    public combineLemma(row: AethelListResult): string {
        return row.phrase.items.map((item) => item.lemma).join(" ");
    }

    public submitWord(): void {
        // When the user submits a new word, go back to the first page.
        this.form.controls.skip.setValue(0);
        this.form.controls.type.setValue("");
        this.prepareQuery();
    }

    private prepareQuery(): void {
        this.form.markAllAsTouched();
        this.form.controls.word.updateValueAndValidity();
        const queryInput: AethelInput = this.form.getRawValue();
        this.updateUrl(queryInput);
    }

    private updateUrl(queryInput: AethelInput): void {
        // This does not actually refresh the page because it just adds
        // parameters to the current route. This triggers a new query.
        const url = this.router
            .createUrlTree([], {
                relativeTo: this.route,
                queryParams: this.formatQueryParams(queryInput),
            })
            .toString();
        this.router.navigateByUrl(url);
    }

    private formatQueryParams(queryInput: AethelInput): AethelInput {
        const queryParams: AethelInput = {};

        // Only include word and type in the URL if they are not null,
        // undefined or an empty string.
        if (queryInput.word && queryInput.word !== "") {
            queryParams.word = queryInput.word;
        }
        if (queryInput.type && queryInput.type !== "") {
            queryParams.type = queryInput.type;
        }

        queryParams.limit = queryInput.limit;
        queryParams.skip = queryInput.skip;

        return queryParams;
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
