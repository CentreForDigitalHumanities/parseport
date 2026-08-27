import { By } from '@angular/platform-browser';
import { AlertContainerDirective } from './alert-container.directive';
import { AlertInfo, AlertService } from '../services/alert.service';
import { AlertType } from '../components/alert/alert.component';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component, ViewChild } from '@angular/core';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

@Component({
    template: `
      <div alertContainer></div>
  `,
    standalone: false
})
class TestComponent {
@ViewChild(AlertContainerDirective) alertContainerDirective!: AlertContainerDirective;
}

describe('AlertContainerDirective', () => {
  let component: TestComponent;
  let fixture: ComponentFixture<TestComponent>;
  let alertService: AlertService;

  beforeEach(async () => {
      await TestBed.configureTestingModule({
          imports: [BrowserAnimationsModule],
          declarations: [ TestComponent, AlertContainerDirective ]
      }).compileComponents();
  });

  beforeEach(() => {
      fixture = TestBed.createComponent(TestComponent);
      component = fixture.componentInstance;
      alertService = TestBed.inject(AlertService);
      fixture.detectChanges();
  });

  it('should create', () => {
      expect(component).toBeTruthy();
  });

  it('should create an alert when the alert service emits an alert', () => {
      const alertInfo: AlertInfo = { type: AlertType.SUCCESS, message: 'Test alert', duration: 5000 };
      // Spying on a private function requires 'any' and the ['functionName'] syntax.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      spyOn<any>(component.alertContainerDirective, 'createAlert');
      alertService.alert$.next(alertInfo);
      // eslint-disable-next-line dot-notation
      expect(component.alertContainerDirective['createAlert']).toHaveBeenCalledWith(alertInfo);
  });

  it('should destroy the alert when the alert component emits a destroyMe event', () => {
      const alertInfo: AlertInfo = { type: AlertType.SUCCESS, message: 'Test alert', duration: 5000 };
      alertService.alert$.next(alertInfo);
      fixture.detectChanges();
      const alertComponent = fixture.debugElement.query(By.css('pp-alert')).componentInstance;
      spyOn(alertComponent.destroyMe, 'emit');
      alertComponent.destroyMe.emit();
      fixture.detectChanges();
      expect(fixture.debugElement.query(By.css('app-alert'))).toBeFalsy();
  });

  it('should close the alert after a certain amount of time', (done) => {
      const alertInfo: AlertInfo = { type: AlertType.SUCCESS, message: 'Test alert', duration: 500 };
      alertService.alert$.next(alertInfo);
      fixture.detectChanges();
      const alertComponent = fixture.debugElement.query(By.css('pp-alert')).componentInstance;
      spyOn(alertComponent, 'closeModal');
      jasmine.clock().install();
      jasmine.clock().tick(1000);
      jasmine.clock().uninstall();
      fixture.detectChanges();
      setTimeout(() => {
          expect(alertComponent.closeModal).toHaveBeenCalled();
          done();
      }, 1000);
  });
});
