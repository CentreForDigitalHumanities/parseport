import { ComponentFixture, TestBed } from "@angular/core/testing";

import { MinimalistParserReferencesComponent } from "./minimalist-parser-references.component";

describe("MinimalistParserReferencesComponent", () => {
    let component: MinimalistParserReferencesComponent;
    let fixture: ComponentFixture<MinimalistParserReferencesComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({}).compileComponents();

        fixture = TestBed.createComponent(MinimalistParserReferencesComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });
});
