import { waitForAsync, ComponentFixture, TestBed } from "@angular/core/testing";
import { NoopAnimationsModule } from "@angular/platform-browser/animations";
import { provideHttpClientTesting } from "@angular/common/http/testing";

import { MenuComponent } from "./menu.component";
import { RouterModule } from "@angular/router";
import { routes } from "../routes";
import { provideHttpClient, withInterceptorsFromDi } from "@angular/common/http";

describe("MenuComponent", () => {
    let component: MenuComponent;
    let fixture: ComponentFixture<MenuComponent>;

    beforeEach(waitForAsync(() => {
        TestBed.configureTestingModule({
            declarations: [MenuComponent],
            imports: [
                NoopAnimationsModule,
                RouterModule.forRoot(routes)],
            providers: [
                provideHttpClient(withInterceptorsFromDi()), provideHttpClientTesting()]
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(MenuComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });
});
