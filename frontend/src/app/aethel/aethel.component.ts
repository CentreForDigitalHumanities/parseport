import { Component, DestroyRef, OnInit } from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { FormControl, FormGroup, Validators } from "@angular/forms";
import { AethelListResult } from "../shared/types";
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
        aethelInput: new FormControl<string>("", {
            validators: [Validators.minLength(3)],
        }),
    });
    public rows: AethelListResult[] = [];
    public loading$ = this.apiService.loading$;
    public submitted = this.apiService.output$.pipe(map(() => true));

    public icons = {
        chevronRight: faChevronRight,
        chevronDown: faChevronDown,
    };

    status$ = new Subject();

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
            });

        // Whenever the query parameter changes, we run a new query.
        this.route.queryParams
            .pipe(
                isNonNull(),
                distinctUntilChanged(),
                takeUntilDestroyed(this.destroyRef),
            )
            .subscribe((query) => {
                const word = query["word"];
                const type = query["type"];
                if (word) {
                    this.form.controls.aethelInput.setValue(word);
                }
                this.apiService.input$.next({ word, type });
            });
    }

    public submit(): void {
        this.form.markAllAsTouched();
        this.form.controls.aethelInput.updateValueAndValidity();
        const query = this.form.controls.aethelInput.value;
        if (!query) {
            return;
        }
        this.updateUrl(query);
    }

    public getSampleURL(sampleName: string): string[] {
        return ["sample", sampleName.replace(".xml", "")];
    }

    private updateUrl(query: string): void {
        // This does not actually refresh the page because it just adds parameters to the current route.
        // It just updates the URL in the browser, triggering a new query.
        const url = this.router
            .createUrlTree([], {
                relativeTo: this.route,
                queryParams: { word: query },
            })
            .toString();
        this.router.navigateByUrl(url);
    }

    /**
     * Adds unique keys to the items in the array. This is needed for the table to keep track of the data and automatically collapse rows when the data changes.
     */
    private addUniqueKeys(items: AethelListResult[]): AethelListResult[] {
        return items.map((item, index) => ({
            ...item,
            key: `${index}-${item.lemma}-${item.word}-${item.type}`,
        }));
    }
}
