import { ComponentFixture, TestBed } from "@angular/core/testing";

import { MinimalistParserBrowserComponent } from "./minimalist-parser-browser.component";

describe("MinimalistParserBrowserComponent", () => {
    let component: MinimalistParserBrowserComponent;
    let fixture: ComponentFixture<MinimalistParserBrowserComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [MinimalistParserBrowserComponent],
        }).compileComponents();

        fixture = TestBed.createComponent(MinimalistParserBrowserComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });
});
