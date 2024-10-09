import { Component, Input } from "@angular/core";
import { AlertService } from "../../services/alert.service";
import { AlertType } from "../alert/alert.component";
import { SpindleApiService } from "../../services/spindle-api.service";
import { faCopy, faDownload } from "@fortawesome/free-solid-svg-icons";

export interface TextOutput {
    extension: "json" | "tex";
    text: string;
}

@Component({
    selector: "pp-spindle-parse-result",
    templateUrl: "./spindle-parse-result.component.html",
    styleUrl: "./spindle-parse-result.component.scss",
})
export class SpindleParseResultComponent {
    @Input({ required: true }) textOutput: TextOutput | null = null;

    public faDownload = faDownload;
    public faCopy = faCopy;

    constructor(
        private alertService: AlertService,
        private apiService: SpindleApiService,
    ) { }

    public downloadAsFile(
        textData: string,
        extension: "tex" | "json" | "pdf",
    ): void {
        this.apiService.downloadAsFile(textData, extension);
    }

    public copyToClipboard(text: string): void {
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
}
