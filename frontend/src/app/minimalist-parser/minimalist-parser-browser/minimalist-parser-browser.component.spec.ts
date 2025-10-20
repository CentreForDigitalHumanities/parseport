import { ComponentFixture, TestBed } from "@angular/core/testing";

import { MinimalistParserBrowserComponent } from "./minimalist-parser-browser.component";
import { HttpClientTestingModule } from "@angular/common/http/testing";
import { SharedModule } from "src/app/shared/shared.module";
import { RouterModule } from "@angular/router";
import { routes } from "src/app/routes";

describe("MinimalistParserBrowserComponent", () => {
    let component: MinimalistParserBrowserComponent;
    let fixture: ComponentFixture<MinimalistParserBrowserComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [MinimalistParserBrowserComponent],
            imports: [HttpClientTestingModule, SharedModule, RouterModule.forRoot(routes)],
        }).compileComponents();

        fixture = TestBed.createComponent(MinimalistParserBrowserComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });
});
