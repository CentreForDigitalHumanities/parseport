import { NgModule } from "@angular/core";
import { MinimalistParserComponent } from "./minimalist-parser.component";
import { MinimalistParserAboutComponent } from "./minimalist-parser-about/minimalist-parser-about.component";
import { MinimalistParserInputComponent } from "./minimalist-parser-input/minimalist-parser-input.component";
import { MinimalistParserBrowserComponent } from "./minimalist-parser-browser/minimalist-parser-browser.component";
import { SharedModule } from "../shared/shared.module";
import { RouterModule } from "@angular/router";
import { NgOptimizedImage } from "@angular/common";
import { IconButtonComponent } from "../shared/components/icon-button/icon-button.component";

@NgModule({
    declarations: [
        MinimalistParserComponent,
        MinimalistParserAboutComponent,
        MinimalistParserInputComponent,
        MinimalistParserBrowserComponent,
    ],
    imports: [SharedModule, RouterModule, NgOptimizedImage, IconButtonComponent],
})
export class MinimalistParserModule { }
