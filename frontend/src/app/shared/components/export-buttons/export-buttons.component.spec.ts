import { ComponentFixture, TestBed } from "@angular/core/testing";

import { ExportButtonsComponent } from "./export-buttons.component";
import { SharedModule } from "../../shared.module";

describe("ExportButtonsComponent", () => {
    let component: ExportButtonsComponent;
    let fixture: ComponentFixture<ExportButtonsComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [SharedModule],
        }).compileComponents();

        fixture = TestBed.createComponent(ExportButtonsComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });
});
