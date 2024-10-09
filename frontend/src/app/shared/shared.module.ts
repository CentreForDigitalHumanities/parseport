import { NgModule } from "@angular/core";
import { AlertComponent } from "./components/alert/alert.component";
import { AlertContainerDirective } from "./directives/alert-container.directive";
import { ExportButtonComponent } from "./components/export-button/export-button.component";
import { ExportButtonsComponent } from "./components/export-buttons/export-buttons.component";
import { ProofPipe } from "./pipes/proof.pipe";
import { AethelApiService } from "./services/aethel-api.service";
import { AlertService } from "./services/alert.service";
import { ConfigService } from "./services/config.service";
import { ErrorHandlerService } from "./services/error-handler.service";
import { SpindleApiService } from "./services/spindle-api.service";
import { StatusService } from "./services/status.service";
import { CommonModule } from "@angular/common";
import { SpindleParseResultComponent } from "./components/spindle-parse-result/spindle-parse-result.component";
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";

@NgModule({
    declarations: [
        AlertComponent,
        AlertContainerDirective,
        ExportButtonComponent,
        ExportButtonsComponent,
        ProofPipe,
        SpindleParseResultComponent,
    ],
    imports: [CommonModule, FontAwesomeModule],
    providers: [
        AethelApiService,
        AlertService,
        ConfigService,
        ErrorHandlerService,
        SpindleApiService,
        StatusService,
    ],
    exports: [
        AlertComponent,
        AlertContainerDirective,
        ExportButtonComponent,
        ExportButtonsComponent,
        ProofPipe,
        SpindleParseResultComponent,
    ],
})
export class SharedModule {}
