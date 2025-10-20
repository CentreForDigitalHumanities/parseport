import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import { Observable } from 'rxjs';

export type ButtonVariant = 'purple' | 'teal' | 'coral';
export type ButtonSize = 'normal' | 'large';

@Component({
    selector: 'pp-icon-button',
    standalone: true,
    imports: [CommonModule, RouterModule, FontAwesomeModule],
    templateUrl: './icon-button.component.html',
    styleUrl: './icon-button.component.scss'
})
export class IconButtonComponent {
    @Input({ required: true }) icon!: IconDefinition;
    @Input({ required: true }) label!: string;
    @Input() routerLink?: string | string[];
    @Input() variant: ButtonVariant = 'purple';
    @Input() size: ButtonSize = 'normal';
    @Input() ariaDescribedBy?: string;
    @Input() description?: string;
    @Input() isLoading$?: Observable<boolean>;

    get buttonClasses(): string[] {
        // return [];
        const classes = ['mp-button', `mp-button-${this.variant}`];

        if (!this.routerLink) {
            classes.push('button');
        }

        if (this.size === 'large') {
            classes.push('large');
        }

        return classes;
    }
}