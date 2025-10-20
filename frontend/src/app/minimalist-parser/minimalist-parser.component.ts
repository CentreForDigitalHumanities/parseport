import { Component } from "@angular/core";
import { faWandMagicSparkles, faBookOpen, faCircleInfo } from "@fortawesome/free-solid-svg-icons";

@Component({
    selector: "pp-minimalist-parser",
    templateUrl: "./minimalist-parser.component.html",
    styleUrl: "./minimalist-parser.component.scss",
})
export class MinimalistParserComponent {
    public icons = {
        parse: faWandMagicSparkles,
        browse: faBookOpen,
        about: faCircleInfo,
    };
}
