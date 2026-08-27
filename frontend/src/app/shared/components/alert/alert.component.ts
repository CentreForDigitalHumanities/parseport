import { AfterViewInit, ChangeDetectorRef, Component, EventEmitter, Output } from '@angular/core';
import { AnimationEvent } from '@angular/animations';
import { animations } from 'src/app/animations';

export enum AlertType {
    INFO = "info",
    SUCCESS = "success",
    WARNING = "warning",
    DANGER = "danger"
}

const ALERT_TYPE_CLASSES: { [key in AlertType]: `is-${key}` } = {
    [AlertType.INFO]: 'is-info',
    [AlertType.SUCCESS]: 'is-success',
    [AlertType.WARNING]: 'is-warning',
    [AlertType.DANGER]: 'is-danger'
};  

@Component({
    selector: 'pp-alert',
    templateUrl: './alert.component.html',
    styleUrls: ['./alert.component.scss'],
    animations: animations,
    standalone: false
})
export class AlertComponent implements AfterViewInit {
    @Output() destroyMe = new EventEmitter<void>();
    message = '';
    type = AlertType.INFO;
    className = '';
    visibility: 'show' | 'hide' = 'hide';

    constructor(private cd: ChangeDetectorRef) { }

    ngAfterViewInit(): void {
        this.visibility = 'show';
        this.className = ALERT_TYPE_CLASSES[this.type];
        this.cd.detectChanges();
    }

    // Called from the alertContainer directive; starts closing animation.
    closeModal(): void {
        this.visibility = 'hide';
    }

    // Fired after closing animation has finished; calls upon 
    // the alertContainer directive to destroy this component.
    afterDone(event: AnimationEvent): void{
        if (event.toState === 'hide') {
            this.destroyMe.emit();
        }
    }
}


