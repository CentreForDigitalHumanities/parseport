import { HttpClient } from "@angular/common/http";
import { Component, DestroyRef, Input, OnInit } from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { Params } from "@angular/router";
import {
    AethelListResult,
    AethelSampleDataResult,
    AethelSampleDataReturn,
} from "src/app/shared/types";
import { environment } from "src/environments/environment";

@Component({
    // eslint-disable-next-line @angular-eslint/component-selector
    selector: "[pp-sample-data]",
    templateUrl: "./sample-data.component.html",
    styleUrl: "./sample-data.component.scss",
})
export class SampleDataComponent implements OnInit {
    @Input({ required: true }) aethelResult!: AethelListResult;

    public samples: AethelSampleDataResult[] = [];
    public loading = false;

    constructor(
        private destroyRef: DestroyRef,
        private http: HttpClient,
    ) {}

    ngOnInit(): void {
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
                this.samples = data.results;
                this.loading = false;
            });
    }

    public getSampleURL(sampleName: string): string[] {
        return ["sample", sampleName.replace(".xml", "")];
    }

    private formatParams(aethelResult: AethelListResult): Params {
        const queryParams: Params = {
            word: JSON.stringify(aethelResult.phrase.items.map((item) => item.word)),
            type: aethelResult.type,
        };
        return queryParams;
    }
}
