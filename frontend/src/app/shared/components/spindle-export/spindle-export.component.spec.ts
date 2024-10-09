import { ComponentFixture, TestBed } from "@angular/core/testing";

import { SpindleExportComponent } from "./spindle-export.component";

describe("SpindleExportComponent", () => {
    let component: SpindleExportComponent;
    let fixture: ComponentFixture<SpindleExportComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [SpindleExportComponent],
        }).compileComponents();

        fixture = TestBed.createComponent(SpindleExportComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });
});
