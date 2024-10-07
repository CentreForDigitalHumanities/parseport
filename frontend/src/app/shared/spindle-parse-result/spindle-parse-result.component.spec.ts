import { ComponentFixture, TestBed } from "@angular/core/testing";

import { SpindleParseResultComponent } from "./spindle-parse-result.component";

describe("SpindleParseResultComponent", () => {
    let component: SpindleParseResultComponent;
    let fixture: ComponentFixture<SpindleParseResultComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [SpindleParseResultComponent],
        }).compileComponents();

        fixture = TestBed.createComponent(SpindleParseResultComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });
});
