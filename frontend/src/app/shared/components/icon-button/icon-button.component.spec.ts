import { ComponentFixture, TestBed } from '@angular/core/testing';
import { IconButtonComponent } from './icon-button.component';
import { faCircleInfo } from '@fortawesome/free-solid-svg-icons';

describe('IconButtonComponent', () => {
    let component: IconButtonComponent;
    let fixture: ComponentFixture<IconButtonComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [IconButtonComponent]
        }).compileComponents();

        fixture = TestBed.createComponent(IconButtonComponent);
        component = fixture.componentInstance;
        component.icon = faCircleInfo;
        component.label = 'Test Label';
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should render the label', () => {
        const compiled = fixture.nativeElement as HTMLElement;
        expect(compiled.querySelector('span')?.textContent).toContain('Test Label');
    });

    it('should apply purple variant by default', () => {
        const compiled = fixture.nativeElement as HTMLElement;
        const button = compiled.querySelector('.mp-button');
        expect(button?.classList.contains('mp-button-purple')).toBeTruthy();
    });

    it('should apply the specified variant', () => {
        component.variant = 'teal';
        fixture.detectChanges();
        const compiled = fixture.nativeElement as HTMLElement;
        const button = compiled.querySelector('.mp-button');
        expect(button?.classList.contains('mp-button-teal')).toBeTruthy();
    });

    it('should render description when provided', () => {
        component.description = 'Test description';
        component.ariaDescribedBy = 'test-id';
        fixture.detectChanges();
        const compiled = fixture.nativeElement as HTMLElement;
        const description = compiled.querySelector('.mp-button-description');
        expect(description?.textContent).toContain('Test description');
        expect(description?.id).toBe('test-id');
    });

    it('should not render description when not provided', () => {
        const compiled = fixture.nativeElement as HTMLElement;
        const description = compiled.querySelector('.mp-button-description');
        expect(description).toBeNull();
    });
});
