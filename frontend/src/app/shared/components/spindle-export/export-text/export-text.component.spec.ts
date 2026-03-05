import { ComponentFixture, TestBed } from "@angular/core/testing";

import { ExportTextComponent } from "./export-text.component";
import { SharedModule } from "../../../shared.module";
import { provideHttpClientTesting } from "@angular/common/http/testing";
import { provideHttpClient, withInterceptorsFromDi } from "@angular/common/http";

describe("ExportTextComponent", () => {
    let component: ExportTextComponent;
    let fixture: ComponentFixture<ExportTextComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [SharedModule],
            providers: [
                provideHttpClient(withInterceptorsFromDi()), provideHttpClientTesting()]
        }).compileComponents();

        fixture = TestBed.createComponent(ExportTextComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });
});
