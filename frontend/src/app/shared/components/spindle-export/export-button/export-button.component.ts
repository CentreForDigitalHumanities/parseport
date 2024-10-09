import { Component, EventEmitter, Input, Output } from "@angular/core";
import { ExportMode } from "src/app/shared/types";

@Component({
    selector: "pp-export-button",
    templateUrl: "./export-button.component.html",
    styleUrls: ["./export-button.component.scss"],
})
export class ExportButtonComponent {
    @Output() exportResult = new EventEmitter<ExportMode>();
    @Input() mode: ExportMode | null = null;
    @Input() isLoading = false;
    @Input() buttonText = $localize`Export`;
    @Input() textBelow: string | null = null;

    public getButtonClass(mode: ExportMode | null): string {
        return mode ? `button ${mode}-button` : "button";
    }
}
