import { ComponentFixture, TestBed } from "@angular/core/testing";

import { MinimalistParserInputComponent } from "./minimalist-parser-input.component";
import { provideHttpClientTesting } from "@angular/common/http/testing";
import { SharedModule } from "src/app/shared/shared.module";
import { provideHttpClient, withInterceptorsFromDi } from "@angular/common/http";

describe("MinimalistParserInputComponent", () => {
    let component: MinimalistParserInputComponent;
    let fixture: ComponentFixture<MinimalistParserInputComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [MinimalistParserInputComponent],
            imports: [SharedModule],
            providers: [
                provideHttpClient(withInterceptorsFromDi()),
                provideHttpClientTesting()
            ]
        }).compileComponents();

        fixture = TestBed.createComponent(MinimalistParserInputComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });
});
