import { HttpClient } from "@angular/common/http";
import { Component, computed, DestroyRef, Input, OnInit, signal } from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { Params } from "@angular/router";
import {
    AethelListResult,
    AethelSampleDataResult,
    AethelSampleDataReturn,
} from "src/app/shared/types";
import { environment } from "src/environments/environment";

@Component({
    // We use this component as an attribute to a <tr>, so it does not mess up PrimeNG's table styles.
    // eslint-disable-next-line @angular-eslint/component-selector
    selector: "[pp-sample-data]",
    templateUrl: "./sample-data.component.html",
    styleUrl: "./sample-data.component.scss",
})
export class SampleDataComponent implements OnInit {
    @Input({ required: true }) aethelResult: AethelListResult | null = null;

    public samples = signal<AethelSampleDataResult[]>([]);
    public loading = false;

    // Hides the "Load More" button when all samples have been loaded.
    public allSamplesLoaded = computed(() => {
        if (!this.aethelResult) {
            return false;
        }
        return this.samples().length >= this.aethelResult.sampleCount;
    });

    constructor(
        private destroyRef: DestroyRef,
        private http: HttpClient,
    ) {}

    ngOnInit(): void {
        this.loadSamples();
    }

    public loadSamples(): void {
        if (!this.aethelResult) {
            return;
        }

        this.loading = true;

        this.http
            .get<AethelSampleDataReturn>(
                `${environment.apiUrl}aethel/sample-data`,
                {
                    params: this.formatParams(this.aethelResult),
                },
            )
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe((data) => {
                this.samples.update(existing => [...existing, ...data.results]);
                this.loading = false;
            });
    }

    public getSampleURL(sampleName: string): string[] {
        return ["sample", sampleName.replace(".xml", "")];
    }

    private formatParams(aethelResult: AethelListResult): Params {
        const queryParams: Params = {
            word: JSON.stringify(
                aethelResult.phrase.items.map((item) => item.word),
            ),
            type: aethelResult.type,
            skip: this.samples().length.toString(),
        };
        return queryParams;
    }
}
