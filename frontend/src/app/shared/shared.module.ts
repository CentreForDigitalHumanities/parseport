import { NgModule } from "@angular/core";
import { AlertComponent } from "./components/alert/alert.component";
import { AlertContainerDirective } from "./directives/alert-container.directive";
import { ExportButtonComponent } from "./components/spindle-export/export-button/export-button.component";
import { ExportButtonsComponent } from "./components/spindle-export/export-buttons/export-buttons.component";
import { ProofPipe } from "./pipes/proof.pipe";
import { AethelApiService } from "./services/aethel-api.service";
import { AlertService } from "./services/alert.service";
import { ConfigService } from "./services/config.service";
import { ErrorHandlerService } from "./services/error-handler.service";
import { SpindleApiService } from "./services/spindle-api.service";
import { StatusService } from "./services/status.service";
import { CommonModule } from "@angular/common";
import { ExportTextComponent } from "./components/spindle-export/export-text/export-text.component";
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";
import { SpindleExportComponent } from "./components/spindle-export/spindle-export.component";
import { MpApiService } from "./services/mp-api.service";
import { ReactiveFormsModule } from "@angular/forms";

@NgModule({
    declarations: [
        AlertComponent,
        AlertContainerDirective,
        ExportButtonComponent,
        ExportButtonsComponent,
        ProofPipe,
        ExportTextComponent,
        SpindleExportComponent,
    ],
    imports: [CommonModule, FontAwesomeModule, ReactiveFormsModule],
    providers: [
        AethelApiService,
        AlertService,
        ConfigService,
        ErrorHandlerService,
        SpindleApiService,
        StatusService,
        MpApiService,
    ],
    exports: [
        AlertComponent,
        AlertContainerDirective,
        ProofPipe,
        SpindleExportComponent,
        ExportButtonComponent,
        CommonModule,
        ReactiveFormsModule,
        FontAwesomeModule,
    ],
})
export class SharedModule {}
