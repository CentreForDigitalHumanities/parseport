import { Directive, OnDestroy, OnInit, ViewContainerRef } from '@angular/core';
import { AlertComponent } from '../components/alert/alert.component';
import { AlertService, AlertInfo } from '../services/alert.service';
import { Subject, takeUntil } from 'rxjs';

@Directive({
    // eslint-disable-next-line @angular-eslint/directive-selector
    selector: '[alertContainer]',
    standalone: false
})
export class AlertContainerDirective implements OnInit, OnDestroy {
    private destroy$ = new Subject<void>();

    constructor(
        private hostViewContainer: ViewContainerRef,
        private alertService: AlertService
    ) { }

    ngOnInit(): void {
        this.alertService.alert$
            .pipe(takeUntil(this.destroy$))
            .subscribe(alertInfo => this.createAlert(alertInfo));
    }

    private createAlert({ type, message, duration }: AlertInfo): void {
        this.hostViewContainer.clear();
    
        const newAlert = this.hostViewContainer.createComponent(AlertComponent);
        newAlert.instance.message = message;
        newAlert.instance.type = type;

        // Destroy the alert when it asks for it.
        newAlert.instance.destroyMe
            .pipe(takeUntil(this.destroy$))
            .subscribe(() => newAlert.destroy());

        // Close the alert after a certain amount of time.
        setTimeout(() => {
            newAlert.instance.closeModal();
        }, duration ?? 10000);
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }
}
