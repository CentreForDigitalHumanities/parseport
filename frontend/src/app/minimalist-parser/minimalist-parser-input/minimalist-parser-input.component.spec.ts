import { ComponentFixture, TestBed } from "@angular/core/testing";

import { MinimalistParserInputComponent } from "./minimalist-parser-input.component";

describe("MinimalistParserInputComponent", () => {
    let component: MinimalistParserInputComponent;
    let fixture: ComponentFixture<MinimalistParserInputComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({}).compileComponents();

        fixture = TestBed.createComponent(MinimalistParserInputComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });
});
