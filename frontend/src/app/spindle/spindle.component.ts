import { Component, DestroyRef, OnInit } from "@angular/core";
import { FormControl, Validators } from "@angular/forms";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { ErrorHandlerService } from "../shared/services/error-handler.service";
import { AethelDetailPhrase, ExportMode } from "../shared/types";
import { SpindleApiService } from "../shared/services/spindle-api.service";
import { Subject, filter, map, share, switchMap, takeUntil, timer } from "rxjs";
import { StatusService } from "../shared/services/status.service";
import { TextOutput } from "../shared/components/spindle-export/export-text/export-text.component";

@Component({
    selector: "pp-spindle",
    templateUrl: "./spindle.component.html",
    styleUrls: ["./spindle.component.scss"],
})
export class SpindleComponent implements OnInit {
    spindleInput = new FormControl<string>("", {
        validators: [Validators.required],
    });
    term: string | null = null;
    textOutput: TextOutput | null = null;
    lexicalPhrases: AethelDetailPhrase[] = [];
    loading$ = this.apiService.loading$;

    stopStatus$ = new Subject<void>();

    spindleReady$ = timer(0, 5000).pipe(
        takeUntil(this.stopStatus$),
        switchMap(() => this.statusService.getStatus$()),
        map((status) => status.spindle),
        share(),
    );

    get parsed(): boolean {
        return this.term !== null && this.lexicalPhrases.length > 0;
    }

    constructor(
        private apiService: SpindleApiService,
        private errorHandler: ErrorHandlerService,
        private destroyRef: DestroyRef,
        private statusService: StatusService,
    ) {}

    ngOnInit(): void {
        this.spindleReady$
            .pipe(
                filter((ready) => ready === true),
                takeUntilDestroyed(this.destroyRef),
            )
            .subscribe(() => this.stopStatus$.next());

        this.apiService.output$
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe((response) => {
                // HTTP error
                if (!response) {
                    return;
                }
                if (response.error) {
                    this.errorHandler.handleSpindleError(response.error);
                    return;
                }
                if (response.latex) {
                    this.textOutput = {
                        extension: "tex",
                        text: response.latex,
                    };
                }
                if (response.redirect) {
                    // Opens a new tab.
                    window.open(response.redirect, "_blank");
                }
                if (response.pdf) {
                    const base64 = response.pdf;
                    this.apiService.downloadAsFile(base64, "pdf");
                }
                if (response.term && response.lexical_phrases) {
                    this.term = response.term;
                    this.lexicalPhrases = response.lexical_phrases;
                }
                if (response.proof) {
                    this.textOutput = {
                        extension: "json",
                        // The additional arguments are for pretty-printing.
                        text: JSON.stringify(response.proof, null, 2),
                    };
                }
            });
    }

    public parse(): void {
        this.clearResults();
        this.exportResult("term-table");
    }

    public exportResult(mode: ExportMode): void {
        this.spindleInput.markAsTouched();
        this.spindleInput.updateValueAndValidity();
        const userInput = this.spindleInput.value;
        if (this.spindleInput.invalid || !userInput) {
            return;
        }
        this.apiService.input$.next({
            mode,
            sentence: userInput,
        });
    }

    private clearResults(): void {
        this.term = null;
        this.textOutput = null;
        this.lexicalPhrases = [];
    }
}
