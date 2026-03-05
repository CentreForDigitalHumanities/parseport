import { ComponentFixture, TestBed } from "@angular/core/testing";

import { SpindleExportComponent } from "./spindle-export.component";
import { SharedModule } from "../../shared.module";
import { provideHttpClientTesting } from "@angular/common/http/testing";
import { provideHttpClient, withInterceptorsFromDi } from "@angular/common/http";

describe("SpindleExportComponent", () => {
    let component: SpindleExportComponent;
    let fixture: ComponentFixture<SpindleExportComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [SharedModule],
            providers: [
                provideHttpClient(withInterceptorsFromDi()), provideHttpClientTesting()]
        }).compileComponents();

        fixture = TestBed.createComponent(SpindleExportComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });
});
