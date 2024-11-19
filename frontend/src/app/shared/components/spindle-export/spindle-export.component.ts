import { Component, EventEmitter, Input, Output } from "@angular/core";
import { TextOutput } from "./export-text/export-text.component";
import { ExportMode } from "../../types";
import { Observable } from "rxjs";

@Component({
    selector: "pp-spindle-export",
    templateUrl: "./spindle-export.component.html",
    styleUrl: "./spindle-export.component.scss",
})
export class SpindleExportComponent {
    @Input({ required: true }) textOutput: TextOutput | null = null;
    @Input({ required: true }) loading$: Observable<ExportMode | null> | null = null;
    @Output() exportResult = new EventEmitter<ExportMode>();
}
