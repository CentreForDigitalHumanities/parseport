import { ComponentFixture, TestBed } from "@angular/core/testing";

import { ExportTextComponent } from "./export-text.component";
import { SharedModule } from "../../../shared.module";
import { HttpClientTestingModule } from "@angular/common/http/testing";

describe("ExportTextComponent", () => {
    let component: ExportTextComponent;
    let fixture: ComponentFixture<ExportTextComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [HttpClientTestingModule, SharedModule],
        }).compileComponents();

        fixture = TestBed.createComponent(ExportTextComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });
});
