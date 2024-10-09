import { Component, EventEmitter, Input, Output } from "@angular/core";
import { ExportMode } from "../../../types";
import { Observable } from "rxjs";

@Component({
    selector: "pp-export-buttons",
    templateUrl: "./export-buttons.component.html",
    styleUrl: "./export-buttons.component.scss",
})
export class ExportButtonsComponent {
    @Input({ required: true })
    public loading$: Observable<ExportMode | null> | null = null;

    @Output()
    public exportResult = new EventEmitter<ExportMode>();
}
