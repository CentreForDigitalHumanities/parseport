import { Component } from "@angular/core";
import { faExternalLinkAlt } from "@fortawesome/free-solid-svg-icons";
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

    public icons = {
        openInNewTab: faExternalLinkAlt,
    };

    constructor(private statusService: StatusService) {}

    public navigateToVulcan(): void {
        const origin = window.location.origin;
        window.open(`${origin}${environment.vulcanUrl}`, "_blank");
    }
}
