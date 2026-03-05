import { TestBed, waitForAsync } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { RouterTestingModule } from '@angular/router/testing';
import { provideHttpClientTesting } from '@angular/common/http/testing';

import { AppComponent } from './app.component';
import { FooterComponent } from './footer/footer.component';
import { MenuComponent } from './menu/menu.component';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';

describe('AppComponent', () => {
    beforeEach(waitForAsync(() => {
        TestBed.configureTestingModule({
            declarations: [
                AppComponent,
                MenuComponent,
                FooterComponent
            ],
            imports: [NoopAnimationsModule, RouterTestingModule],
            providers: [provideHttpClient(withInterceptorsFromDi()), provideHttpClientTesting()]
        }).compileComponents();
    }));

    it('should create the app', () => {
        const fixture = TestBed.createComponent(AppComponent);
        const app = fixture.debugElement.componentInstance;
        expect(app).toBeTruthy();
    });

    it(`should have as title 'ParsePort'`, () => {
        const fixture = TestBed.createComponent(AppComponent);
        const app = fixture.debugElement.componentInstance;
        expect(app.title).toEqual(`ParsePort`);
    });

    it('should render title', () => {
        const fixture = TestBed.createComponent(AppComponent);
        fixture.detectChanges();
        const compiled = fixture.debugElement.nativeElement;
        expect(compiled.querySelector('.navbar-brand .navbar-item').textContent).toContain('ParsePort');
    });
});
