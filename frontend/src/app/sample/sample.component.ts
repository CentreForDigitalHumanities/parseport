import { Component } from "@angular/core";
import { ActivatedRoute, Params, Router } from "@angular/router";
import { AethelApiService } from "../shared/services/aethel-api.service";
import { map, Observable } from "rxjs";
import { AethelMode, ExportMode, LexicalPhrase } from "../shared/types";
import { isNonNull } from "../shared/operators/IsNonNull";
import { faArrowLeft } from "@fortawesome/free-solid-svg-icons";
import { Location } from "@angular/common";
import { SpindleApiService } from "../shared/services/spindle-api.service";
import { TextOutput } from "../shared/spindle-parse-result/spindle-parse-result.component";
import { ErrorHandlerService } from "../shared/services/error-handler.service";

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

    public textOutput$: Observable<TextOutput | null> = this.spindleService.output$.pipe(map(response => {
        if (!response) {
            return null;
        }
        if (response.error) {
            this.errorHandler.handleSpindleError(response.error);
            return null;
        }
        if (response.latex) {
            return {
                extension: "tex",
                text: response.latex,
            };
        }
        if (response.proof) {
            return {
                extension: "json",
                // The additional arguments are for pretty-printing.
                text: JSON.stringify(response.proof, null, 2),
            };
        }
        return null;
    }));

    constructor(
        private route: ActivatedRoute,
        private spindleService: SpindleApiService,
        private aethelService: AethelApiService,
        private errorHandler: ErrorHandlerService,
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
