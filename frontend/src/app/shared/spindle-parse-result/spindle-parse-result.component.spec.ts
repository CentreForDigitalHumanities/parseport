import { ComponentFixture, TestBed } from "@angular/core/testing";

import { SpindleParseResultComponent } from "./spindle-parse-result.component";
import { SharedModule } from "../shared.module";
import { HttpClientTestingModule } from "@angular/common/http/testing";

describe("SpindleParseResultComponent", () => {
    let component: SpindleParseResultComponent;
    let fixture: ComponentFixture<SpindleParseResultComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [HttpClientTestingModule, SharedModule],
        }).compileComponents();

        fixture = TestBed.createComponent(SpindleParseResultComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });
});
