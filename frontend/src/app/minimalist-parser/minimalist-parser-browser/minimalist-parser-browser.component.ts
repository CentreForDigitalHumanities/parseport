import { Component } from "@angular/core";
import { map } from "rxjs";
import { StatusService } from "src/app/shared/services/status.service";
import { environment } from "src/environments/environment";

@Component({
    selector: "pp-minimalist-parser-browser",
    templateUrl: "./minimalist-parser-browser.component.html",
    styleUrl: "./minimalist-parser-browser.component.scss",
})
export class MinimalistParserBrowserComponent {
    public statusOk$ = this.statusService
        .getStatus$()
        .pipe(map((status) => status.vulcan));

    constructor(private statusService: StatusService) {}

    public navigateToVulcan(): void {
        const origin = window.location.origin;
        window.location.href = `${origin}${environment.vulcanUrl}`;
    }
}
