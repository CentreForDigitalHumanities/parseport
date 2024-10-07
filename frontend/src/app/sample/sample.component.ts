import { Component } from "@angular/core";
import { ActivatedRoute, Params, Router } from "@angular/router";
import { AethelApiService } from "../shared/services/aethel-api.service";
import { map } from "rxjs";
import { AethelMode, ExportMode, LexicalPhrase } from "../shared/types";
import { isNonNull } from "../shared/operators/IsNonNull";
import { faArrowLeft } from "@fortawesome/free-solid-svg-icons";
import { Location } from "@angular/common";
import { SpindleApiService } from "../shared/services/spindle-api.service";

@Component({
    selector: "pp-sample",
    templateUrl: "./sample.component.html",
    styleUrl: "./sample.component.scss",
})
export class SampleComponent {
    private sampleName = this.route.snapshot.params["sampleName"];
    private sample$ = this.aethelService.sampleResult$(this.sampleName);
    public sampleResult$ = this.sample$.pipe(
        map((response) => response?.result),
        isNonNull(),
    );

    public icons = {
        arrowLeft: faArrowLeft,
    };

    public loading$ = this.spindleService.loading$;

    constructor(
        private route: ActivatedRoute,
        private spindleService: SpindleApiService,
        private aethelService: AethelApiService,
        private router: Router,
        private location: Location,
    ) {}

    public searchAethel(phrase: LexicalPhrase, mode: AethelMode): void {
        const queryParams = this.formatQueryParams(phrase, mode);
        this.router.navigate(["/aethel"], { queryParams });
    }

    public exportResult(mode: ExportMode, sentence: string): void {
        this.spindleService.input$.next({
            mode,
            sentence
        })
    }

    public showButtons(items: LexicalPhrase["items"]): boolean {
        // Buttons are hidden if the phrase contains too few characters.
        const combined = items.map((item) => item.word).join(" ");
        return combined.length > 2;
    }

    public goBack(): void {
        this.location.back();
    }

    private formatQueryParams(phrase: LexicalPhrase, mode: AethelMode): Params {
        const queryParams: Params = {};
        if (mode === "word" || mode === "word-and-type") {
            queryParams["word"] = phrase.items
                .map((item) => item.word)
                .join(" ");
        }
        if (mode === "type" || mode === "word-and-type") {
            queryParams["type"] = phrase.type;
        }
        return queryParams;
    }
}
