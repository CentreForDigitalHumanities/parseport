import { NgModule } from "@angular/core";
import { MinimalistParserComponent } from "./minimalist-parser.component";
import { MinimalistParserAboutComponent } from "./minimalist-parser-about/minimalist-parser-about.component";
import { MinimalistParserInputComponent } from "./minimalist-parser-input/minimalist-parser-input.component";
import { MinimalistParserReferencesComponent } from "./minimalist-parser-references/minimalist-parser-references.component";
import { MinimalistParserBrowserComponent } from "./minimalist-parser-browser/minimalist-parser-browser.component";
import { SharedModule } from "../shared/shared.module";

@NgModule({
    declarations: [
        MinimalistParserComponent,
        MinimalistParserAboutComponent,
        MinimalistParserInputComponent,
        MinimalistParserReferencesComponent,
        MinimalistParserBrowserComponent,
    ],
    imports: [SharedModule],
})
export class MinimalistParserModule {}
