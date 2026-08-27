import { ComponentFixture, TestBed } from "@angular/core/testing";

import { MinimalistParserComponent } from "./minimalist-parser.component";
import { CommonModule } from "@angular/common";
import { RouterModule } from "@angular/router";
import { routes } from "src/app/routes";

describe("MinimalistParserComponent", () => {
    let component: MinimalistParserComponent;
    let fixture: ComponentFixture<MinimalistParserComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [CommonModule, RouterModule.forRoot(routes)],
        }).compileComponents();

        fixture = TestBed.createComponent(MinimalistParserComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });
});
