import { Component, DestroyRef, OnInit } from "@angular/core";
import { FormControl, Validators } from "@angular/forms";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { ErrorHandlerService } from "../shared/services/error-handler.service";
import { AlertService } from "../shared/services/alert.service";
import { AlertType } from "../shared/components/alert/alert.component";
import { faDownload, faCopy } from "@fortawesome/free-solid-svg-icons";
import { LexicalPhrase, ExportMode } from "../shared/types";
import { SpindleApiService } from "../shared/services/spindle-api.service";
import { Subject, filter, map, share, switchMap, takeUntil, timer } from "rxjs";
import { StatusService } from "../shared/services/status.service";

interface TextOutput {
    extension: "json" | "tex";
    text: string;
}

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
    lexicalPhrases: LexicalPhrase[] = [];
    loading$ = this.apiService.loading$;

    faCopy = faCopy;
    faDownload = faDownload;

    stopStatus$ = new Subject<void>();

    spindleReady$ = timer(0, 5000).pipe(
        takeUntil(this.stopStatus$),
        switchMap(() => this.statusService.get()),
        map((status) => status.spindle),
        share(),
    );

    constructor(
        private apiService: SpindleApiService,
        private alertService: AlertService,
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
                    this.downloadAsFile(base64, "pdf");
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
                if (response.term && response.lexical_phrases) {
                    this.term = response.term;
                    this.lexicalPhrases = response.lexical_phrases;
                }
            });
    }

    parse(): void {
        this.clearResults();
        this.exportResult("term-table");
    }

    get parsed(): boolean {
        return this.term !== null && this.lexicalPhrases.length > 0;
    }

    exportResult(mode: ExportMode): void {
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

    copyToClipboard(text: string): void {
        navigator.clipboard
            .writeText(text)
            .then(() => {
                this.alertService.alert$.next({
                    message: $localize`Copied to clipboard.`,
                    type: AlertType.SUCCESS,
                });
            })
            .catch(() => {
                this.alertService.alert$.next({
                    message: $localize`Failed to copy to clipboard.`,
                    type: AlertType.DANGER,
                });
            });
    }

    downloadAsFile(textData: string, extension: "tex" | "json" | "pdf"): void {
        const fileName = "spindleParseResult." + extension;
        let url = "";
        // PDF data (base64) does not need to be converted to a blob.
        if (extension === "pdf") {
            url = `data:application/pdf;base64,${textData}`;
        } else {
            const blob = new Blob([textData], {
                type: `application/${extension}`,
            });
            url = window.URL.createObjectURL(blob);
        }

        this.downloadFile(fileName, url);

        // Revoke the object URL after downloading.
        if (extension !== "pdf") {
            this.revokeObjectURL(url);
        }
    }

    private clearResults(): void {
        this.term = null;
        this.textOutput = null;
        this.lexicalPhrases = [];
    }

    private downloadFile(fileName: string, url: string): void {
        const link = document.createElement("a");
        link.href = url;
        link.download = fileName;
        link.click();
        link.remove();
    }

    private revokeObjectURL(url: string): void {
        window.URL.revokeObjectURL(url);
    }
}
