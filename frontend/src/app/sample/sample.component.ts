import { Component } from "@angular/core";
import { ActivatedRoute, Params, Router } from "@angular/router";
import { AethelApiService } from "../shared/services/aethel-api.service";
import { map } from "rxjs";
import { AethelMode, AethelDetailPhrase } from "../shared/types";
import { isNonNull } from "../shared/operators/IsNonNull";
import { faArrowLeft } from "@fortawesome/free-solid-svg-icons";
import { Location } from "@angular/common";

@Component({
    selector: "pp-sample",
    templateUrl: "./sample.component.html",
    styleUrl: "./sample.component.scss",
})
export class SampleComponent {
    private sampleName = this.route.snapshot.params["sampleName"];
    private sample$ = this.apiService.sampleResult$(this.sampleName);
    public sampleResult$ = this.sample$.pipe(
        map((response) => response?.result),
        isNonNull(),
    );

    public icons = {
        arrowLeft: faArrowLeft,
    };

    constructor(
        private route: ActivatedRoute,
        private apiService: AethelApiService,
        private router: Router,
        private location: Location,
    ) {}

    public searchAethel(phrase: AethelDetailPhrase, mode: AethelMode): void {
        const queryParams = this.formatQueryParams(phrase, mode);
        this.router.navigate(["/aethel"], { queryParams });
    }

    public showButtons(items: AethelDetailPhrase["items"]): boolean {
        // Buttons are hidden if the phrase contains too few characters.
        const combined = items.map((item) => item.word).join(" ");
        return combined.length > 2;
    }

    public goBack(): void {
        this.location.back();
    }

    private formatQueryParams(
        phrase: AethelDetailPhrase,
        mode: AethelMode,
    ): Params {
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
