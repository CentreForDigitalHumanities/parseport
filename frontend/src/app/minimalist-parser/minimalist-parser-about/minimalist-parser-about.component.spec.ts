import { ComponentFixture, TestBed } from "@angular/core/testing";
import { RouterModule } from "@angular/router";
import { MinimalistParserAboutComponent } from "./minimalist-parser-about.component";
import { routes } from "src/app/routes";

describe("MinimalistParserAboutComponent", () => {
    let component: MinimalistParserAboutComponent;
    let fixture: ComponentFixture<MinimalistParserAboutComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [RouterModule.forRoot(routes)],
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
