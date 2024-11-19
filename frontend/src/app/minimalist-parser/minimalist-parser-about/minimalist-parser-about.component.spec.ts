import { ComponentFixture, TestBed } from "@angular/core/testing";

import { MinimalistParserAboutComponent } from "./minimalist-parser-about.component";

describe("MinimalistParserAboutComponent", () => {
    let component: MinimalistParserAboutComponent;
    let fixture: ComponentFixture<MinimalistParserAboutComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [MinimalistParserAboutComponent],
        }).compileComponents();

        fixture = TestBed.createComponent(MinimalistParserAboutComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });
});
